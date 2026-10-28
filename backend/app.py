"""
FastAPI Backend Application for GenCV.
Exposes full RESTful endpoints for:
- Portfolio CRUD & sample seeding
- Gemini API unstructured parser & JD matcher
- Dynamic resume generation & DOCX export
- Google Sheets sync & Apps Script integration
- Settings management
"""

import os
import json
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Response, Request
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .database import (
    init_db, get_db_connection, get_complete_portfolio, update_personal_info,
    set_setting, get_setting, save_generated_resume, get_generated_resumes
)
from .seed_data import seed_database
from .gemini_service import (
    parse_unstructured_portfolio, analyze_job_description,
    match_portfolio_with_jd, tailor_bullet_points, get_active_api_key
)
from .sheets_service import (
    sync_via_apps_script, export_portfolio_csv_bundle, GOOGLE_APPS_SCRIPT_TEMPLATE
)
from .docx_generator import generate_resume_docx

# Initialize FastAPI App
app = FastAPI(
    title="GenCV API",
    description="AI-Powered Portfolio Management & Dynamic Job-Specific Resume Generator",
    version="1.0.0"
)

# Enable CORS for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()
    seed_database()

# -------------------------------------------------------------
# Portfolio Endpoints
# -------------------------------------------------------------
@app.get("/api/portfolio")
def api_get_portfolio():
    """Fetch complete portfolio database records."""
    try:
        portfolio = get_complete_portfolio()
        # Mask sensitive keys in settings
        if "settings" in portfolio:
            k = portfolio["settings"].get("gemini_api_key", "")
            if k:
                portfolio["settings"]["gemini_api_key_masked"] = f"{k[:4]}...{k[-4:]}" if len(k) > 8 else "***"
                portfolio["settings"]["gemini_api_key_set"] = True
            else:
                portfolio["settings"]["gemini_api_key_set"] = False
        return {"status": "success", "data": portfolio}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portfolio/personal")
def api_update_personal(data: Dict[str, Any]):
    """Update personal and contact info."""
    try:
        update_personal_info(data)
        return {"status": "success", "message": "Personal information updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portfolio/seed")
def api_seed_portfolio():
    """Reset / re-seed database with rich sample data."""
    try:
        seed_database()
        return {"status": "success", "message": "Sample portfolio data seeded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

VALID_CATEGORIES = {
    "education": ["institution", "degree", "field_of_study", "start_date", "end_date", "gpa", "highlights", "location", "order_index"],
    "skills": ["name", "category", "proficiency", "years_of_experience", "is_featured", "order_index"],
    "work_experience": ["company", "position", "employment_type", "location", "start_date", "end_date", "is_current", "description", "bullet_points", "technologies", "order_index"],
    "projects": ["title", "role", "start_date", "end_date", "live_url", "github_url", "description", "bullet_points", "tech_stack", "impact_metrics", "order_index"],
    "certifications": ["name", "issuing_organization", "issue_date", "expiration_date", "credential_id", "credential_url", "order_index"],
    "achievements": ["title", "issuer", "date", "description", "category", "order_index"],
    "publications": ["title", "publisher_or_conference", "publication_date", "url", "abstract_snippet", "co_authors", "order_index"],
    "languages": ["language", "proficiency", "order_index"]
}

@app.post("/api/portfolio/{category}")
def api_add_item(category: str, item: Dict[str, Any]):
    """Add a new item to any portfolio category."""
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
    
    fields = VALID_CATEGORIES[category]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Process json serialized fields for lists
    prepared_item = {}
    for f in fields:
        val = item.get(f)
        if f in ["bullet_points", "technologies", "tech_stack"] and isinstance(val, list):
            prepared_item[f] = json.dumps(val)
        else:
            prepared_item[f] = val
            
    cols = ", ".join(prepared_item.keys())
    placeholders = ", ".join([f":{k}" for k in prepared_item.keys()])
    
    sql = f"INSERT INTO {category} ({cols}) VALUES ({placeholders})"
    cursor.execute(sql, prepared_item)
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"status": "success", "id": new_id, "message": f"Added item to {category}"}

@app.put("/api/portfolio/{category}/{item_id}")
def api_update_item(category: str, item_id: int, item: Dict[str, Any]):
    """Update an existing portfolio entry."""
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
        
    fields = VALID_CATEGORIES[category]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    prepared_item = {}
    for f in fields:
        if f in item:
            val = item.get(f)
            if f in ["bullet_points", "technologies", "tech_stack"] and isinstance(val, list):
                prepared_item[f] = json.dumps(val)
            else:
                prepared_item[f] = val
                
    set_clause = ", ".join([f"{k} = :{k}" for k in prepared_item.keys()])
    prepared_item["item_id"] = item_id
    
    sql = f"UPDATE {category} SET {set_clause} WHERE id = :item_id"
    cursor.execute(sql, prepared_item)
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": f"Updated item in {category}"}

@app.delete("/api/portfolio/{category}/{item_id}")
def api_delete_item(category: str, item_id: int):
    """Delete an item from a portfolio category."""
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"DELETE FROM {category} WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": f"Deleted item {item_id} from {category}"}

# -------------------------------------------------------------
# Gemini AI Endpoints
# -------------------------------------------------------------
class ParseRequest(BaseModel):
    raw_text: str
    api_key: Optional[str] = None

@app.post("/api/portfolio/parse-unstructured")
def api_parse_unstructured(payload: ParseRequest):
    """Parse unstructured resume text into structured schema via Gemini."""
    try:
        parsed = parse_unstructured_portfolio(payload.raw_text, payload.api_key)
        return {"status": "success", "data": parsed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class JDAnalyzeRequest(BaseModel):
    jd_text: str
    api_key: Optional[str] = None

@app.post("/api/jd/analyze")
def api_analyze_jd(payload: JDAnalyzeRequest):
    """Analyze a Job Description and extract key skills, requirements, and keywords."""
    try:
        analysis = analyze_job_description(payload.jd_text, payload.api_key)
        return {"status": "success", "data": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class JDMatchRequest(BaseModel):
    jd_text: str
    api_key: Optional[str] = None

@app.post("/api/jd/match")
def api_match_jd(payload: JDMatchRequest):
    """Match portfolio against JD, score alignment, and recommend items."""
    try:
        portfolio = get_complete_portfolio()
        result = match_portfolio_with_jd(portfolio, payload.jd_text, payload.api_key)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TailorBulletsRequest(BaseModel):
    item_type: str # "experience" or "project"
    item_title: str
    original_bullets: List[str]
    jd_keywords: List[str]
    target_role: str
    api_key: Optional[str] = None

@app.post("/api/resume/tailor-bullets")
def api_tailor_bullets(payload: TailorBulletsRequest):
    """Tailor bullet points to emphasize JD keywords without inventing facts."""
    try:
        refined = tailor_bullet_points(
            payload.item_type,
            payload.item_title,
            payload.original_bullets,
            payload.jd_keywords,
            payload.target_role,
            payload.api_key
        )
        return {"status": "success", "data": refined}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------------------------------------
# Resume Customization, History & DOCX Export
# -------------------------------------------------------------
@app.post("/api/resume/save")
def api_save_resume(data: Dict[str, Any]):
    """Save generated customized resume to database history."""
    try:
        resume_id = save_generated_resume(data)
        return {"status": "success", "id": resume_id, "message": "Resume configuration saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resume/history")
def api_get_resume_history():
    """Retrieve history of customized resumes generated."""
    try:
        history = get_generated_resumes()
        return {"status": "success", "data": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/export-docx")
def api_export_docx(resume_data: Dict[str, Any]):
    """Generate and return a downloadable .docx resume file."""
    try:
        buffer = generate_resume_docx(resume_data)
        full_name = resume_data.get("personal_info", {}).get("full_name", "Resume").replace(" ", "_")
        target_role = (resume_data.get("target_role") or "Tailored").replace(" ", "_")
        filename = f"{full_name}_{target_role}_Resume.docx"
        
        return Response(
            content=buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------------------------------------
# Google Sheets Integration Endpoints
# -------------------------------------------------------------
class SheetsSyncRequest(BaseModel):
    webhook_url: Optional[str] = None

@app.post("/api/sheets/sync")
def api_sync_sheets(payload: SheetsSyncRequest):
    """Synchronize portfolio database to Google Sheets."""
    url = payload.webhook_url or get_setting("google_sheets_webhook_url")
    if not url:
        raise HTTPException(
            status_code=400,
            detail="Google Sheets Webhook URL is not set. Please provide it or configure in Settings."
        )
    try:
        set_setting("google_sheets_webhook_url", url)
        result = sync_via_apps_script(url)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sheets/csv-bundle")
def api_export_csv_bundle():
    """Export all portfolio categories formatted as CSV tables."""
    try:
        bundle = export_portfolio_csv_bundle()
        return {"status": "success", "data": bundle}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sheets/apps-script-code")
def api_get_apps_script_template():
    """Retrieve Google Apps Script integration code."""
    return {"status": "success", "code": GOOGLE_APPS_SCRIPT_TEMPLATE}

# -------------------------------------------------------------
# Settings Management
# -------------------------------------------------------------
@app.post("/api/settings")
def api_update_settings(settings: Dict[str, str]):
    """Update system settings (Gemini API key, Google Sheet Webhook URL, etc.)."""
    try:
        for k, v in settings.items():
            if v is not None:
                set_setting(k, v.strip())
        return {"status": "success", "message": "Settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------------------------------------
# Static Files & SPA Routing
# -------------------------------------------------------------
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_dir = os.path.join(root_dir, "frontend")

css_dir = os.path.join(root_dir, "css")
if not os.path.exists(css_dir):
    css_dir = os.path.join(frontend_dir, "css")
if os.path.exists(css_dir):
    app.mount("/css", StaticFiles(directory=css_dir), name="css")

js_dir = os.path.join(root_dir, "js")
if not os.path.exists(js_dir):
    js_dir = os.path.join(frontend_dir, "js")
if os.path.exists(js_dir):
    app.mount("/js", StaticFiles(directory=js_dir), name="js")

if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
def serve_index():
    """Serve the single page application HTML."""
    root_index = os.path.join(root_dir, "index.html")
    if os.path.exists(root_index):
        return FileResponse(root_index)
    index_file = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "GenCV API online. Please access frontend."}
