"""
Database schema, connection management, and CRUD helpers for GenCV.
Uses SQLite for zero-configuration, robust local structured storage.
"""

import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "portfolio.db")

def get_db_connection():
    """Create and return a database connection with dict-like row access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Initialize database schema if it doesn't already exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Personal Information
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS personal_info (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        full_name TEXT NOT NULL,
        professional_title TEXT,
        email TEXT NOT NULL,
        phone TEXT,
        location TEXT,
        linkedin_url TEXT,
        github_url TEXT,
        portfolio_url TEXT,
        career_objective TEXT,
        professional_summary TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Education
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS education (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        institution TEXT NOT NULL,
        degree TEXT NOT NULL,
        field_of_study TEXT,
        start_date TEXT,
        end_date TEXT,
        gpa TEXT,
        highlights TEXT,
        location TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Skills
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Technical',
        proficiency TEXT DEFAULT 'Intermediate', -- Beginner, Intermediate, Advanced, Expert
        years_of_experience REAL,
        is_featured INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0
    )
    """)

    # Work Experience
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS work_experience (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        position TEXT NOT NULL,
        employment_type TEXT DEFAULT 'Full-time', -- Full-time, Internship, Contract, Freelance
        location TEXT,
        start_date TEXT,
        end_date TEXT,
        is_current INTEGER DEFAULT 0,
        description TEXT,
        bullet_points TEXT, -- JSON Array of strings
        technologies TEXT,   -- JSON Array of strings
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Projects
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        role TEXT,
        start_date TEXT,
        end_date TEXT,
        live_url TEXT,
        github_url TEXT,
        description TEXT,
        bullet_points TEXT, -- JSON Array of strings
        tech_stack TEXT,    -- JSON Array of strings
        impact_metrics TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Certifications & Courses
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS certifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        issuing_organization TEXT NOT NULL,
        issue_date TEXT,
        expiration_date TEXT,
        credential_id TEXT,
        credential_url TEXT,
        order_index INTEGER DEFAULT 0
    )
    """)

    # Achievements & Awards
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        issuer TEXT,
        date TEXT,
        description TEXT,
        category TEXT DEFAULT 'Honors',
        order_index INTEGER DEFAULT 0
    )
    """)

    # Research Papers & Publications
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS publications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        publisher_or_conference TEXT,
        publication_date TEXT,
        url TEXT,
        abstract_snippet TEXT,
        co_authors TEXT,
        order_index INTEGER DEFAULT 0
    )
    """)

    # Languages
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS languages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        language TEXT NOT NULL,
        proficiency TEXT DEFAULT 'Professional Working', -- Native, Fluent, Professional Working, Conversational
        order_index INTEGER DEFAULT 0
    )
    """)

    # Saved Generated Resumes History
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS generated_resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_title TEXT NOT NULL,
        target_company TEXT,
        job_description TEXT,
        match_score INTEGER,
        tailored_summary TEXT,
        selected_data TEXT, -- JSON object of active IDs and customized items
        template_name TEXT DEFAULT 'modern_tech',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # System Settings (API keys, Google Sheet ID, sync timestamp)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Default Google Sheet configuration
    cursor.execute("""
    INSERT OR IGNORE INTO system_settings (setting_key, setting_value)
    VALUES ('google_sheet_url', 'https://docs.google.com/spreadsheets/d/1663le16ErUauJUFrSak8vgA9vY9cLKoAYDw2YosqA70/edit?gid=0#gid=0')
    """)

    conn.commit()
    conn.close()

def get_complete_portfolio() -> Dict[str, Any]:
    """Retrieve the entire portfolio database as a cleanly structured dictionary."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Personal info
    cursor.execute("SELECT * FROM personal_info WHERE id = 1")
    personal_row = cursor.fetchone()
    personal = dict(personal_row) if personal_row else {}

    # Education
    cursor.execute("SELECT * FROM education ORDER BY order_index ASC, id DESC")
    education = [dict(r) for r in cursor.fetchall()]

    # Skills
    cursor.execute("SELECT * FROM skills ORDER BY category ASC, order_index ASC, name ASC")
    skills = [dict(r) for r in cursor.fetchall()]

    # Work experience
    cursor.execute("SELECT * FROM work_experience ORDER BY order_index ASC, id DESC")
    experience_rows = cursor.fetchall()
    experience = []
    for r in experience_rows:
        d = dict(r)
        d['bullet_points'] = json.loads(d['bullet_points']) if d.get('bullet_points') else []
        d['technologies'] = json.loads(d['technologies']) if d.get('technologies') else []
        experience.append(d)

    # Projects
    cursor.execute("SELECT * FROM projects ORDER BY order_index ASC, id DESC")
    project_rows = cursor.fetchall()
    projects = []
    for r in project_rows:
        d = dict(r)
        d['bullet_points'] = json.loads(d['bullet_points']) if d.get('bullet_points') else []
        d['tech_stack'] = json.loads(d['tech_stack']) if d.get('tech_stack') else []
        projects.append(d)

    # Certifications
    cursor.execute("SELECT * FROM certifications ORDER BY order_index ASC, id DESC")
    certifications = [dict(r) for r in cursor.fetchall()]

    # Achievements
    cursor.execute("SELECT * FROM achievements ORDER BY order_index ASC, id DESC")
    achievements = [dict(r) for r in cursor.fetchall()]

    # Publications
    cursor.execute("SELECT * FROM publications ORDER BY order_index ASC, id DESC")
    publications = [dict(r) for r in cursor.fetchall()]

    # Languages
    cursor.execute("SELECT * FROM languages ORDER BY order_index ASC, id ASC")
    languages = [dict(r) for r in cursor.fetchall()]

    # Settings
    cursor.execute("SELECT setting_key, setting_value FROM system_settings")
    settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}

    conn.close()

    return {
        "personal_info": personal,
        "education": education,
        "skills": skills,
        "work_experience": experience,
        "projects": projects,
        "certifications": certifications,
        "achievements": achievements,
        "publications": publications,
        "languages": languages,
        "settings": settings
    }

def update_personal_info(data: Dict[str, Any]):
    """Update or insert personal information."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO personal_info (
        id, full_name, professional_title, email, phone, location,
        linkedin_url, github_url, portfolio_url, career_objective,
        professional_summary, updated_at
    ) VALUES (
        1, :full_name, :professional_title, :email, :phone, :location,
        :linkedin_url, :github_url, :portfolio_url, :career_objective,
        :professional_summary, CURRENT_TIMESTAMP
    )
    ON CONFLICT(id) DO UPDATE SET
        full_name = excluded.full_name,
        professional_title = excluded.professional_title,
        email = excluded.email,
        phone = excluded.phone,
        location = excluded.location,
        linkedin_url = excluded.linkedin_url,
        github_url = excluded.github_url,
        portfolio_url = excluded.portfolio_url,
        career_objective = excluded.career_objective,
        professional_summary = excluded.professional_summary,
        updated_at = CURRENT_TIMESTAMP
    """, {
        "full_name": data.get("full_name", ""),
        "professional_title": data.get("professional_title", ""),
        "email": data.get("email", ""),
        "phone": data.get("phone", ""),
        "location": data.get("location", ""),
        "linkedin_url": data.get("linkedin_url", ""),
        "github_url": data.get("github_url", ""),
        "portfolio_url": data.get("portfolio_url", ""),
        "career_objective": data.get("career_objective", ""),
        "professional_summary": data.get("professional_summary", "")
    })
    conn.commit()
    conn.close()

def set_setting(key: str, value: str):
    """Store or update a setting value."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO system_settings (setting_key, setting_value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_at = CURRENT_TIMESTAMP
    """, (key, value))
    conn.commit()
    conn.close()

def get_setting(key: str, default: Optional[str] = None) -> Optional[str]:
    """Retrieve a setting value."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT setting_value FROM system_settings WHERE setting_key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row['setting_value'] if row else default

def save_generated_resume(data: Dict[str, Any]) -> int:
    """Save a generated customized resume to history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO generated_resumes (
        job_title, target_company, job_description, match_score,
        tailored_summary, selected_data, template_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("job_title", "Custom Resume"),
        data.get("target_company", ""),
        data.get("job_description", ""),
        data.get("match_score", 0),
        data.get("tailored_summary", ""),
        json.dumps(data.get("selected_data", {})),
        data.get("template_name", "modern_tech")
    ))
    resume_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return resume_id

def get_generated_resumes() -> List[Dict[str, Any]]:
    """Get history of generated resumes."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM generated_resumes ORDER BY id DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    for r in rows:
        if r.get("selected_data"):
            try:
                r["selected_data"] = json.loads(r["selected_data"])
            except Exception:
                pass
    conn.close()
    return rows
