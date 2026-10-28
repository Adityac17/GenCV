"""
Generate and save two distinct customized resumes from the same portfolio
demonstrating tailoring for:
1. Senior Full-Stack AI Engineer (ApexAI Platforms)
2. Lead Data Scientist & ML Specialist (Quantitative Intelligence Analytics)
"""

import os
import json
import requests

BASE_URL = "http://localhost:8000"

def generate_samples():
    print("Fetching portfolio database...")
    port_res = requests.get(f"{BASE_URL}/api/portfolio").json()
    portfolio = port_res["data"]
    personal = portfolio["personal_info"]

    samples_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "samples")
    os.makedirs(samples_dir, exist_ok=True)

    # ---------------------------------------------------------
    # Resume 1: AI Automation Engineer & Full-Stack Developer
    # ---------------------------------------------------------
    print("\n--- Generating Resume 1: AI Automation Engineer & Full-Stack Developer ---")
    with open(os.path.join(samples_dir, "sample_jd_1_fullstack_ai.txt"), "r") as f:
        jd_1_text = f.read()

    match_1_res = requests.post(f"{BASE_URL}/api/jd/match", json={"jd_text": jd_1_text}).json()
    match_1 = match_1_res["data"]
    print(f"Match 1 Score: {match_1['match_score']}%")

    # Filter portfolio items tailored for AI Automation & Full-Stack
    fs_skills = [s for s in portfolio["skills"] if s["name"] in [
        "Python", "JavaScript & TypeScript", "Next.js & React 18", "Claude Code & Agentic Workflows",
        "n8n Workflow Automation", "Google AI Studio & Gemini API", "Supabase & PostgreSQL",
        "Node.js & Express.js", "REST API Architecture & JWT Auth", "Vercel & CI/CD Deployment",
        "Lead Scraper Pipeline Engineering", "Solo Product Engineering & Shipping"
    ]]
    
    fs_experience = portfolio["work_experience"]

    fs_projects = [
        portfolio["projects"][0], # AI Lead-Generation & CRM Suite (TradeFlow · LeadRelay)
        portfolio["projects"][1], # Dynamic SVG Vector Graphics Editor
        portfolio["projects"][2]  # KidSafe Ride Tracker
    ]

    resume_1_payload = {
        "personal_info": personal,
        "target_role": "AI Automation Engineer & Full-Stack Developer",
        "target_company": "ApexAI Platforms",
        "job_description": jd_1_text,
        "match_score": match_1["match_score"],
        "tailored_summary": match_1["tailored_professional_summary"],
        "skills": fs_skills,
        "work_experience": fs_experience,
        "projects": fs_projects,
        "education": portfolio["education"],
        "certifications": portfolio["certifications"][:2],
        "achievements": portfolio["achievements"][:2],
        "template_name": "template-modern-tech",
        "density": "compact"
    }

    # Save to history database
    save_1_res = requests.post(f"{BASE_URL}/api/resume/save", json=resume_1_payload).json()
    print("Saved Resume 1 to database with ID:", save_1_res.get("id"))

    # Export DOCX
    docx_1_res = requests.post(f"{BASE_URL}/api/resume/export-docx", json=resume_1_payload)
    docx_1_path = os.path.join(samples_dir, "Resume_1_Senior_FullStack_AI_Engineer.docx")
    with open(docx_1_path, "wb") as f:
        f.write(docx_1_res.content)
    print(f"Exported DOCX: {docx_1_path} ({len(docx_1_res.content)} bytes)")

    # ---------------------------------------------------------
    # Resume 2: Systems Software & Full-Stack Engineer
    # ---------------------------------------------------------
    print("\n--- Generating Resume 2: Systems Software & Full-Stack Engineer ---")
    with open(os.path.join(samples_dir, "sample_jd_2_data_scientist.txt"), "r") as f:
        jd_2_text = f.read()

    match_2_res = requests.post(f"{BASE_URL}/api/jd/match", json={"jd_text": jd_2_text}).json()
    match_2 = match_2_res["data"]
    print(f"Match 2 Score: {match_2['match_score']}%")

    # Filter portfolio items tailored for Systems & Core Engineering
    ds_skills = [s for s in portfolio["skills"] if s["name"] in [
        "Python", "C++", "JavaScript & TypeScript", "SQL (PostgreSQL, Supabase)",
        "Next.js & React 18", "Node.js & Express.js", "MongoDB & Mongoose",
        "Data Structures & Graph Algorithms", "Git & GitHub Actions", "Vercel & CI/CD Deployment"
    ]]

    ds_experience = portfolio["work_experience"]

    ds_projects = [
        portfolio["projects"][3], # Smart Global Supply Chain Risk Management System (C++)
        portfolio["projects"][1], # Dynamic SVG Vector Graphics Editor
        portfolio["projects"][4]  # Restaurant Management REST API
    ]

    resume_2_payload = {
        "personal_info": personal,
        "target_role": "Systems Software & Full-Stack Engineer",
        "target_company": "Quantitative Intelligence Analytics (QIA)",
        "job_description": jd_2_text,
        "match_score": match_2["match_score"],
        "tailored_summary": (
            "Versatile Systems and Full-Stack Engineer with strong foundation in modern C++, graph algorithms, and autonomous AI integrations. "
            "Proven track record of architecting mathematical canvas engines, production REST microservices, and high-throughput data pipelines."
        ),
        "skills": ds_skills,
        "work_experience": ds_experience,
        "projects": ds_projects,
        "education": portfolio["education"],
        "certifications": portfolio["certifications"][:2],
        "achievements": portfolio["achievements"][:2],
        "publications": portfolio["publications"],
        "template_name": "template-classic-ats",
        "density": "compact"
    }

    # Save to history database
    save_2_res = requests.post(f"{BASE_URL}/api/resume/save", json=resume_2_payload).json()
    print("Saved Resume 2 to database with ID:", save_2_res.get("id"))

    # Export DOCX
    docx_2_res = requests.post(f"{BASE_URL}/api/resume/export-docx", json=resume_2_payload)
    docx_2_path = os.path.join(samples_dir, "Resume_2_Lead_Data_Scientist.docx")
    with open(docx_2_path, "wb") as f:
        f.write(docx_2_res.content)
    print(f"Exported DOCX: {docx_2_path} ({len(docx_2_res.content)} bytes)")

    print("\n✓ Successfully generated both customized resumes and saved them to database and samples directory!")

if __name__ == "__main__":
    generate_samples()
