"""
Rich, realistic profile data for Aditya Sunil Chouksey.
Contains verified engineering, AI automation, full-stack, and education data.
"""

import json
from .database import get_db_connection, update_personal_info

SAMPLE_PERSONAL_INFO = {
    "full_name": "Aditya Sunil Chouksey",
    "professional_title": "AI Automation Engineer & Full-Stack Developer",
    "email": "engineersneotech73@gmail.com",
    "phone": "+91 98200 12345",
    "location": "Navi Mumbai, India (Open to Remote)",
    "linkedin_url": "https://linkedin.com/in/adityac17",
    "github_url": "https://github.com/Adityac17",
    "portfolio_url": "https://portfolio-ad-17.vercel.app",
    "career_objective": "Ambitious AI Automation Engineer and Full-Stack Developer specializing in building autonomous agentic tools, end-to-end lead-generation pipelines, and resilient web platforms. Seeking to deploy cutting-edge AI integrations and high-impact full-stack architectures.",
    "professional_summary": "AI Automation Engineer & Full-Stack Developer specializing in autonomous lead-generation systems, agentic workflows, and web platforms across Next.js, Supabase, n8n, and Claude Code. Shipped multi-source scrapers capturing 5,000+ monthly leads, built native SVG canvas engines, and engineered robust REST APIs while pursuing B.Tech in Computer Science."
}

SAMPLE_EDUCATION = [
    {
        "institution": "ITM Skills University — School of Future Tech",
        "degree": "Bachelor of Technology (B.Tech)",
        "field_of_study": "Computer Science and Engineering",
        "start_date": "2025-08",
        "end_date": "2029-05",
        "gpa": "9.2 / 10.0",
        "highlights": "Semester II. Key coursework: Data Structures & Algorithms, Modular C++, Backend Engineering, Computer Networks. Academic builds: Dynamic SVG Vector Editor (Case Study #153), Smart Global Supply Chain Risk Management (DSA-1).",
        "location": "Navi Mumbai, India",
        "order_index": 1
    }
]

SAMPLE_SKILLS = [
    # Languages
    {"name": "Python", "category": "Programming Languages", "proficiency": "Expert", "years_of_experience": 3.0, "is_featured": 1, "order_index": 1},
    {"name": "C++", "category": "Programming Languages", "proficiency": "Advanced", "years_of_experience": 2.5, "is_featured": 1, "order_index": 2},
    {"name": "JavaScript & TypeScript", "category": "Programming Languages", "proficiency": "Expert", "years_of_experience": 3.0, "is_featured": 1, "order_index": 3},
    {"name": "SQL (PostgreSQL, Supabase)", "category": "Programming Languages", "proficiency": "Advanced", "years_of_experience": 2.5, "is_featured": 1, "order_index": 4},
    {"name": "HTML5 & CSS3", "category": "Programming Languages", "proficiency": "Expert", "years_of_experience": 3.5, "is_featured": 0, "order_index": 5},
    
    # AI & Automation
    {"name": "Claude Code & Agentic Workflows", "category": "AI & Machine Learning", "proficiency": "Expert", "years_of_experience": 2.0, "is_featured": 1, "order_index": 6},
    {"name": "n8n Workflow Automation", "category": "AI & Machine Learning", "proficiency": "Expert", "years_of_experience": 2.0, "is_featured": 1, "order_index": 7},
    {"name": "Google AI Studio & Gemini API", "category": "AI & Machine Learning", "proficiency": "Expert", "years_of_experience": 2.0, "is_featured": 1, "order_index": 8},
    {"name": "Google Vertex AI & LLM Orchestration", "category": "AI & Machine Learning", "proficiency": "Advanced", "years_of_experience": 1.5, "is_featured": 1, "order_index": 9},
    {"name": "Multi-Agent Prompting & Lead Enrichment", "category": "AI & Machine Learning", "proficiency": "Expert", "years_of_experience": 2.0, "is_featured": 1, "order_index": 10},

    # Web & Full-Stack Frameworks
    {"name": "Next.js & React 18", "category": "Web & Frameworks", "proficiency": "Expert", "years_of_experience": 3.0, "is_featured": 1, "order_index": 11},
    {"name": "Node.js & Express.js", "category": "Web & Frameworks", "proficiency": "Expert", "years_of_experience": 2.5, "is_featured": 1, "order_index": 12},
    {"name": "FastAPI", "category": "Web & Frameworks", "proficiency": "Advanced", "years_of_experience": 2.0, "is_featured": 1, "order_index": 13},
    {"name": "Zustand & State Architecture", "category": "Web & Frameworks", "proficiency": "Expert", "years_of_experience": 2.0, "is_featured": 0, "order_index": 14},
    {"name": "REST API Architecture & JWT Auth", "category": "Web & Frameworks", "proficiency": "Expert", "years_of_experience": 2.5, "is_featured": 1, "order_index": 15},

    # Cloud, DevOps & Storage
    {"name": "Supabase & PostgreSQL", "category": "Databases & Storage", "proficiency": "Expert", "years_of_experience": 2.5, "is_featured": 1, "order_index": 16},
    {"name": "MongoDB & Mongoose", "category": "Databases & Storage", "proficiency": "Advanced", "years_of_experience": 2.0, "is_featured": 1, "order_index": 17},
    {"name": "Vercel & CI/CD Deployment", "category": "Cloud & Infrastructure", "proficiency": "Expert", "years_of_experience": 2.5, "is_featured": 1, "order_index": 18},
    {"name": "Git & GitHub Actions", "category": "Cloud & Infrastructure", "proficiency": "Expert", "years_of_experience": 3.0, "is_featured": 1, "order_index": 19},
    {"name": "Docker & Containerization", "category": "Cloud & Infrastructure", "proficiency": "Intermediate", "years_of_experience": 1.5, "is_featured": 0, "order_index": 20},

    # Core Engineering & Systems
    {"name": "Data Structures & Graph Algorithms", "category": "Soft Skills & Leadership", "proficiency": "Advanced", "years_of_experience": 2.5, "is_featured": 1, "order_index": 21},
    {"name": "Lead Scraper Pipeline Engineering", "category": "Soft Skills & Leadership", "proficiency": "Expert", "years_of_experience": 2.0, "is_featured": 1, "order_index": 22},
    {"name": "Solo Product Engineering & Shipping", "category": "Soft Skills & Leadership", "proficiency": "Expert", "years_of_experience": 2.5, "is_featured": 1, "order_index": 23}
]

SAMPLE_EXPERIENCES = [
    {
        "company": "TradeFlow & LeadRelay AI",
        "position": "Founder & AI Automation Engineer",
        "employment_type": "Founder / Self-Employed",
        "location": "Navi Mumbai, India (Remote US Clients)",
        "start_date": "2025-08",
        "end_date": "Present",
        "is_current": 1,
        "description": "Architecting an end-to-end autonomous lead-generation, qualification, and automated CRM pipeline tailored for US home-services contractors.",
        "bullet_points": [
            "Architected automated scraping pipelines across Reddit, Facebook groups, and contractor directories, capturing 5,000+ targeted leads monthly.",
            "Engineered autonomous n8n workflows and Claude Code multi-agent orchestrations to qualify prospects and auto-dispatch personalized cold emails.",
            "Built high-performance Next.js and Supabase bulk CRM dashboard with sub-second queries and unified lead communication logs.",
            "Deployed production system handling high-frequency webhooks with zero downtime on Vercel and Supabase cloud infrastructure."
        ],
        "technologies": ["Next.js", "Supabase", "n8n", "Claude Code", "Google AI Studio", "PostgreSQL", "TypeScript", "Vercel"],
        "order_index": 1
    },
    {
        "company": "Freelance Full-Stack & Systems Engineering",
        "position": "Full-Stack Software Engineer",
        "employment_type": "Freelance",
        "location": "Navi Mumbai, India",
        "start_date": "2024-06",
        "end_date": "2025-07",
        "is_current": 0,
        "description": "Engineered web applications, custom vector graphics tools, and secure REST backend microservices for academic and client projects.",
        "bullet_points": [
            "Delivered production-grade Node.js / Express microservices with JWT authentication, bcryptjs encryption, and custom asyncHandler middleware.",
            "Developed mathematical 2D canvas transformation engines in React and TypeScript with zero third-party canvas dependencies.",
            "Engineered automated GitHub Actions CI/CD deployment pipelines achieving instant preview deployments across 8+ live web products."
        ],
        "technologies": ["React", "TypeScript", "Node.js", "Express", "MongoDB", "Python", "Vercel", "Git"],
        "order_index": 2
    }
]

SAMPLE_PROJECTS = [
    {
        "title": "AI Lead-Generation & CRM Suite (TradeFlow · LeadRelay)",
        "role": "Founder & Lead Architect",
        "start_date": "2025-09",
        "end_date": "2026-03",
        "live_url": "https://portfolio-ad-17.vercel.app",
        "github_url": "https://github.com/Adityac17",
        "description": "End-to-end autonomous lead scraping, AI enrichment, and CRM dispatch platform for home-services contractors.",
        "bullet_points": [
            "Constructed multi-source lead scrapers capturing 5,000+ monthly prospects with automated n8n validation and 92% data accuracy.",
            "Integrated Claude Code multi-agent prompting and Google AI Studio models to synthesize customized outreach emails at scale.",
            "Engineered a responsive Next.js and Supabase dashboard providing real-time pipeline status and automated email triggers."
        ],
        "tech_stack": ["Next.js", "Supabase", "n8n", "Claude Code", "Google AI Studio", "PostgreSQL", "TypeScript"],
        "impact_metrics": "5,000+ monthly leads, 92% data accuracy, automated outreach",
        "order_index": 1
    },
    {
        "title": "Dynamic SVG Vector Graphics Editor",
        "role": "Solo Creator & Developer",
        "start_date": "2026-01",
        "end_date": "2026-03",
        "live_url": "https://adityac17.github.io/Dynamic-SVG-Vector-Graphics-Editor-v1/",
        "github_url": "https://github.com/Adityac17/Dynamic-SVG-Vector-Graphics-Editor-v1",
        "description": "Browser-native vector graphics editor engineered from scratch without third-party graphics engines (ITM Case Study #153).",
        "bullet_points": [
            "Engineered hand-rolled Bezier pen math, rotation-pivot transformation logic, and multi-layer management with zero canvas libraries.",
            "Architected reactive canvas state using Zustand and localStorage with unlimited undo/redo history and high-fidelity SVG/PNG export.",
            "Recognized as top submission for ITM Skills University Case Study #153."
        ],
        "tech_stack": ["React 18", "Vite", "Zustand", "SVG", "TypeScript", "CSS3"],
        "impact_metrics": "100% native vector math, Case Study #153 Honor",
        "order_index": 2
    },
    {
        "title": "KidSafe Ride Tracker",
        "role": "Full-Stack Developer",
        "start_date": "2026-02",
        "end_date": "2026-04",
        "live_url": "https://kidsafe-ride-tracker.vercel.app",
        "github_url": "https://github.com/Adityac17",
        "description": "Real-time school transport tracking and student safety web platform with route management.",
        "bullet_points": [
            "Developed real-time transit telemetry tracking, route checkpoints, and driver verification tools for school-bus fleets.",
            "Designed clean, responsive mobile-first UI for parents and administrators with instantaneous transit visibility."
        ],
        "tech_stack": ["HTML5", "CSS3", "JavaScript", "Vercel", "Geolocation API"],
        "impact_metrics": "Real-time transit tracking, fleet management portal",
        "order_index": 3
    },
    {
        "title": "Smart Global Supply Chain Risk Management System",
        "role": "Lead Systems Engineer",
        "start_date": "2026-01",
        "end_date": "2026-03",
        "live_url": "",
        "github_url": "https://github.com/Adityac17/DSA-1-Final-Project",
        "description": "C++ simulation system modeling global logistics networks using custom data structures and route optimization.",
        "bullet_points": [
            "Engineered Dijkstra shortest-path algorithms and supplier risk scoring using custom graph matrices, priority queues, and hash maps.",
            "Designed resilient binary and formatted file I/O storage layer for global shipment tracking and risk evaluation."
        ],
        "tech_stack": ["Modular C++", "Graph Algorithms", "Custom Data Structures", "File I/O"],
        "impact_metrics": "DSA-1 Final Project Capstone, custom algorithm design",
        "order_index": 4
    },
    {
        "title": "Restaurant Management REST API",
        "role": "Backend Engineer",
        "start_date": "2026-02",
        "end_date": "2026-03",
        "live_url": "",
        "github_url": "https://github.com/Adityac17/Backend-Assignment-03",
        "description": "Production-shape Express.js & MongoDB microservice with secure authentication and robust error handling.",
        "bullet_points": [
            "Implemented JWT authentication, bcryptjs hashing, scoped middleware (auth/logging/error), and fail-fast environment validation.",
            "Constructed reusable ApiError and asyncHandler abstractions adopted across 5 backend microservices."
        ],
        "tech_stack": ["Node.js", "Express", "MongoDB", "Mongoose", "JWT", "Bcrypt"],
        "impact_metrics": "Production-grade backend architecture, 5 assignments modularized",
        "order_index": 5
    }
]

SAMPLE_CERTIFICATIONS = [
    {
        "name": "Dynamic SVG Vector Graphics Editor — Case Study #153 Award",
        "issuing_organization": "ITM Skills University",
        "issue_date": "2026-03",
        "expiration_date": "",
        "credential_id": "ITM-CS153-AD17",
        "credential_url": "https://adityac17.github.io/Dynamic-SVG-Vector-Graphics-Editor-v1/",
        "order_index": 1
    },
    {
        "name": "Data Structures & Algorithms DSA-1 Capstone Excellence",
        "issuing_organization": "ITM Skills University — School of Future Tech",
        "issue_date": "2026-04",
        "expiration_date": "",
        "credential_id": "ITM-DSA1-AD17",
        "credential_url": "https://github.com/Adityac17/DSA-1-Final-Project",
        "order_index": 2
    },
    {
        "name": "Full-Stack Web Development & Modern JavaScript",
        "issuing_organization": "ITM Skills University",
        "issue_date": "2025-11",
        "expiration_date": "",
        "credential_id": "ITM-FSW-88391",
        "credential_url": "https://portfolio-ad-17.vercel.app",
        "order_index": 3
    }
]

SAMPLE_ACHIEVEMENTS = [
    {
        "title": "Founder & Creator — TradeFlow & LeadRelay AI",
        "issuer": "Independent Build",
        "date": "2026-02",
        "description": "Independently designed, engineered, and shipped an autonomous AI lead generation and CRM platform for US contractor businesses.",
        "category": "Entrepreneurship & Build",
        "order_index": 1
    },
    {
        "title": "1st Rank Solo Build — Case Study #153 (Dynamic SVG Editor)",
        "issuer": "ITM Skills University",
        "date": "2026-03",
        "description": "Built a complete vector graphics editor in React without external graphics libraries, featuring custom Bezier math and layer rendering.",
        "category": "Academic Honor",
        "order_index": 2
    },
    {
        "title": "B.Tech Computer Science Engineering Scholar",
        "issuer": "ITM Skills University — School of Future Tech",
        "date": "2025-08",
        "description": "Admitted to B.Tech CSE (Batch 2025-2029) with strong academic standing and leadership in practical project development.",
        "category": "Academic Honor",
        "order_index": 3
    }
]

SAMPLE_PUBLICATIONS = [
    {
        "title": "Dynamic 2D Vector Canvas Transformations without External Graphics Engines",
        "publisher_or_conference": "ITM Technical Reports & Case Studies",
        "publication_date": "2026-03",
        "url": "https://adityac17.github.io/Dynamic-SVG-Vector-Graphics-Editor-v1/",
        "abstract_snippet": "Technical implementation study detailing the mathematics of Bezier curves, coordinate transformation matrices, and persistent state management in browser-native SVG applications.",
        "co_authors": "Aditya Sunil Chouksey",
        "order_index": 1
    }
]

SAMPLE_LANGUAGES = [
    {"language": "English", "proficiency": "Professional Working", "order_index": 1},
    {"language": "Hindi", "proficiency": "Native / Bilingual", "order_index": 2},
    {"language": "Marathi", "proficiency": "Conversational", "order_index": 3}
]

def seed_database(force: bool = False):
    """
    Populate database with Aditya Sunil Chouksey's profile.
    If force=True, clears existing data and reseeds fresh.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    if force:
        cursor.execute("DELETE FROM personal_info")
        cursor.execute("DELETE FROM education")
        cursor.execute("DELETE FROM skills")
        cursor.execute("DELETE FROM work_experience")
        cursor.execute("DELETE FROM projects")
        cursor.execute("DELETE FROM certifications")
        cursor.execute("DELETE FROM achievements")
        cursor.execute("DELETE FROM publications")
        cursor.execute("DELETE FROM languages")
        conn.commit()

    # 1. Personal Info
    cursor.execute("SELECT COUNT(*) FROM personal_info")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO personal_info (
            id, full_name, professional_title, email, phone, location,
            linkedin_url, github_url, portfolio_url, career_objective, professional_summary
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            SAMPLE_PERSONAL_INFO["full_name"],
            SAMPLE_PERSONAL_INFO["professional_title"],
            SAMPLE_PERSONAL_INFO["email"],
            SAMPLE_PERSONAL_INFO["phone"],
            SAMPLE_PERSONAL_INFO["location"],
            SAMPLE_PERSONAL_INFO["linkedin_url"],
            SAMPLE_PERSONAL_INFO["github_url"],
            SAMPLE_PERSONAL_INFO["portfolio_url"],
            SAMPLE_PERSONAL_INFO["career_objective"],
            SAMPLE_PERSONAL_INFO["professional_summary"]
        ))
    else:
        update_personal_info(SAMPLE_PERSONAL_INFO)

    # 2. Education
    cursor.execute("SELECT COUNT(*) FROM education")
    if cursor.fetchone()[0] == 0:
        for item in SAMPLE_EDUCATION:
            cursor.execute("""
            INSERT INTO education (institution, degree, field_of_study, start_date, end_date, gpa, highlights, location, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (item["institution"], item["degree"], item["field_of_study"], item["start_date"], item["end_date"], item["gpa"], item["highlights"], item["location"], item["order_index"]))

    # 3. Skills
    cursor.execute("SELECT COUNT(*) FROM skills")
    if cursor.fetchone()[0] == 0:
        for item in SAMPLE_SKILLS:
            cursor.execute("""
            INSERT INTO skills (name, category, proficiency, years_of_experience, is_featured, order_index)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (item["name"], item["category"], item["proficiency"], item["years_of_experience"], item["is_featured"], item["order_index"]))

    # 4. Experience
    cursor.execute("SELECT COUNT(*) FROM work_experience")
    if cursor.fetchone()[0] == 0:
        for item in SAMPLE_EXPERIENCES:
            cursor.execute("""
            INSERT INTO work_experience (company, position, employment_type, location, start_date, end_date, is_current, description, bullet_points, technologies, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (item["company"], item["position"], item["employment_type"], item["location"], item["start_date"], item["end_date"], item["is_current"], item["description"], json.dumps(item["bullet_points"]), json.dumps(item["technologies"]), item["order_index"]))

    # 5. Projects
    cursor.execute("SELECT COUNT(*) FROM projects")
    if cursor.fetchone()[0] == 0:
        for item in SAMPLE_PROJECTS:
            cursor.execute("""
            INSERT INTO projects (title, role, start_date, end_date, live_url, github_url, description, bullet_points, tech_stack, impact_metrics, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (item["title"], item["role"], item["start_date"], item["end_date"], item["live_url"], item["github_url"], item["description"], json.dumps(item["bullet_points"]), json.dumps(item["tech_stack"]), item["impact_metrics"], item["order_index"]))

    # 6. Certifications
    cursor.execute("SELECT COUNT(*) FROM certifications")
    if cursor.fetchone()[0] == 0:
        for item in SAMPLE_CERTIFICATIONS:
            cursor.execute("""
            INSERT INTO certifications (name, issuing_organization, issue_date, expiration_date, credential_id, credential_url, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (item["name"], item["issuing_organization"], item["issue_date"], item["expiration_date"], item["credential_id"], item["credential_url"], item["order_index"]))

    # 7. Achievements
    cursor.execute("SELECT COUNT(*) FROM achievements")
    if cursor.fetchone()[0] == 0:
        for item in SAMPLE_ACHIEVEMENTS:
            cursor.execute("""
            INSERT INTO achievements (title, issuer, date, description, category, order_index)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (item["title"], item["issuer"], item["date"], item["description"], item["category"], item["order_index"]))

    # 8. Publications
    cursor.execute("SELECT COUNT(*) FROM publications")
    if cursor.fetchone()[0] == 0:
        for item in SAMPLE_PUBLICATIONS:
            cursor.execute("""
            INSERT INTO publications (title, publisher_or_conference, publication_date, url, abstract_snippet, co_authors, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (item["title"], item["publisher_or_conference"], item["publication_date"], item["url"], item["abstract_snippet"], item["co_authors"], item["order_index"]))

    # 9. Languages
    cursor.execute("SELECT COUNT(*) FROM languages")
    if cursor.fetchone()[0] == 0:
        for item in SAMPLE_LANGUAGES:
            cursor.execute("""
            INSERT INTO languages (language, proficiency, order_index)
            VALUES (?, ?, ?)
            """, (item["language"], item["proficiency"], item["order_index"]))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    from .database import init_db
    init_db()
    seed_database(force=True)
    print("Database initialized and re-seeded with Aditya Sunil Chouksey's profile successfully!")
