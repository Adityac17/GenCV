# GenCV: AI-Powered Portfolio Management & Dynamic Resume Generator
> **Powered by Gemini AI** • Built with Python (FastAPI), SQLite, Google Sheets API, and Vanilla Modern CSS/JS.
> **Repository**: [https://github.com/Adityac17/GenCV](https://github.com/Adityac17/GenCV) • **Connected Google Sheet**: [View Spreadsheet](https://docs.google.com/spreadsheets/d/1663le16ErUauJUFrSak8vgA9vY9cLKoAYDw2YosqA70/edit?gid=0#gid=0)

GenCV is an end-to-end career portfolio database and job-tailored resume generation platform. It maintains comprehensive career information, categorized skills, certifications, projects, and work experience in a structured relational database, integrates the **Google Gemini API** for unstructured parsing, job description (JD) matching, and grounded resume tailoring, synchronizes bidirectionally with **Google Sheets**, and exports ATS-optimized resumes in both **PDF** and **Microsoft Word (.docx)** formats.

---

## 🎬 Video Demonstration & Walkthrough

> Watch the full end-to-end video walkthrough demonstrating portfolio database management, Gemini API unstructured parsing, job description analysis, interactive resume parameter customization (density, emphasis, and section reordering), and Google Sheets synchronization.

[![GenCV Demo Video Walkthrough](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

*Note: Replace the link and thumbnail above with your recorded video walkthrough URL (YouTube, Loom, Google Drive, or embed locally with `![Demo](./demo_walkthrough.mp4)`).*

---

## 🌟 Key Features

### 1. Centralized Portfolio Database
- **Relational Schema (SQLite)**: Structured storage for all 10 standard professional categories:
  - Personal and Contact Information
  - Career Objective & Executive Summary
  - Educational Qualifications & Honors
  - Categorized Technical & Soft Skills (with proficiency and experience metrics)
  - Certifications & Online Courses
  - Projects with live URLs, GitHub repos, tech stacks, and impact metrics
  - Internships & Work Experience (with granular bullet points and technologies)
  - Achievements, Awards & Hackathons
  - Research Papers & Publications
  - Languages & Fluency Levels
- Full CRUD interface to add, edit, feature, and delete entries.
- Pre-seeded with candidate profile (**Aditya Sunil Chouksey**).

### 2. Gemini API Intelligent Processing (Zero-Hallucination)
- **Unstructured Data Parser**: Paste raw resumes, LinkedIn exports, or bios—Gemini parses and auto-populates structured database records.
- **Job Description Deep Analysis**: Extracts technical requirements, nice-to-haves, domain keywords, and seniority levels.
- **Portfolio vs. JD Matcher & Gap Analysis**:
  - Calculates match percentage score (0–100%) with weighted breakdowns.
  - Identifies direct skill matches and flags missing skills with actionable suggestions.
  - Computes relevance rankings for each project and experience item.
- **Strictly Grounded Resume Tailoring (Anti-Hallucination)**:
  - Synthesizes job-aligned professional summaries strictly from verified portfolio data.
  - Tailors bullet points to emphasize JD keywords while preserving factual truth (no invented metrics or employers).
- Built-in heuristic NLP fallback engine ensuring zero runtime failures.

### 3. Google Sheets Integration & Synchronization
- **Google Apps Script Web App Synchronizer**: One-click sync that dispatches all portfolio categories to 9 distinct styled tabs (`Personal_Info`, `Skills`, `Work_Experience`, `Projects`, `Education`, `Certifications`, `Achievements`, `Publications`, `Languages`).
- **Google Sheets API v4 Integration**: Direct API support for service account credentials.
- **Universal Multi-Tab CSV Bundle**: Direct download of formatted CSV tables for every portfolio category.
- Google Sheets serves as an accessible external data source.

### 4. Dynamic Resume Builder & Live Preview
- **1-Page Compact vs Detailed (2-Page) Density**:
  - *1-Page Compact (Default)*: Curated for modern 6-second recruiter scans (~320 words, top 2 roles × 2 bullets, top 2 projects × 2 bullets, categorized skills).
  - *Detailed (2-Page)*: Comprehensive multi-page view for academic or government CVs.
- **Emphasis Selector**:
  - *Technical*: Prioritizes coding stack, frameworks, and system performance metrics.
  - *Leadership*: Prioritizes systems architecture, pipeline ownership, and founder builds.
  - *Balanced*: Evenly distributes technical and organizational competencies.
- **Dynamic Section Layout Reordering**:
  - Interactive Move Up / Move Down buttons to reorder sections (Summary, Skills, Experience, Projects, Education) dynamically across both the web preview and exported Word documents.
- **Recruiter Scan Meter**: Live word counter and scan-readiness rating indicator.
- **Automated Metric Bolding**: Regex engine that automatically bolds quantitative metrics (e.g. `5,000+`, `92%`, `150,000+`, `$120k`) so key results stand out instantly.
- **3 Professional ATS-Compliant Templates**:
  1. **Modern Tech**: Accent colors, skill chips, modern typography.
  2. **Classic ATS**: Single-column, black-and-white, conservative layout with maximum ATS scannability.
  3. **Minimalist Executive**: Editorial typography, refined whitespace, elegant dividers.
- **Keyword Density Highlighting**: Visual badge highlights of matching JD keywords in the live preview.

### 5. Multi-Format Downloads (PDF & DOCX)
- **High-Fidelity PDF Export**: Print-ready CSS (`@media print`) configured for standard Letter/A4 pagination with crisp formatting.
- **Native Microsoft Word (.docx) Export**: Server-side generator using `python-docx` with professional typography, custom margins, formatted runs, and dynamic section ordering.
- **Resume History & Versioning**: Saves generated custom resumes to database history for comparative review and instant reload.

### 6. Atmospheric Design System (Anti-AI-Slop Architecture)
- **Deep Obsidian & Slate Dark Mode**: Atmospheric dark palette (`#080a0f`) with subtle 28px dot-grid mesh, layered cards (`#0f121a`), and warm industrial amber accents (`#f59e0b`).
- **Custom Dark Scrollbars**: Seamless custom scrollbars that preserve dark immersion.
- **Curated Typography**: Dual font pairing with geometric `Space Grotesk` for titles and humanist `Plus Jakarta Sans` for body legibility, alongside `JetBrains Mono` for metadata tokens.
- **Strict 8pt Grid & Hierarchy**: Systematic spacing scale (`--space-1` through `--space-8`), responsive breakpoints, and WCAG AAA contrast ratios (5.5:1+).

---

## 🏗️ System Architecture

```
GenCV/
├── backend/
│   ├── app.py                # FastAPI main application & REST API endpoints
│   ├── database.py           # SQLite connection, relational schema, and CRUD
│   ├── seed_data.py          # Comprehensive candidate portfolio profile
│   ├── gemini_service.py     # Gemini API integration & grounded tailoring
│   ├── sheets_service.py     # Google Sheets sync & Apps Script webhook
│   └── docx_generator.py     # Native Word (.docx) resume builder
├── frontend/
│   ├── index.html            # Single Page Application (HTML5)
│   ├── css/
│   │   ├── style.css         # Modern styling, dark/light theme, glassmorphism
│   │   └── resume_templates.css # Multi-template resume print & preview styles
│   └── js/
│       ├── app.js            # Main application coordinator
│       ├── portfolio.js      # Portfolio CRUD & AI parser controller
│       ├── jd_matcher.js     # JD analyzer & Gemini match visualizer
│       ├── resume_builder.js # Dynamic selector, preview, & export triggers
│       ├── sheets_sync.js    # Google Sheets webhook & CSV export handler
│       └── api.js            # REST API client
├── samples/
│   ├── sample_jd_1_fullstack_ai.txt   # Target JD 1: Senior Full-Stack AI Engineer
│   ├── sample_jd_2_data_scientist.txt # Target JD 2: Lead Data Scientist & ML Specialist
│   ├── Resume_1_Senior_FullStack_AI_Engineer.docx # Generated Resume 1
│   ├── Resume_2_Lead_Data_Scientist.docx         # Generated Resume 2
│   └── google_apps_script.js          # Ready-to-deploy Google Apps Script
├── tests/
│   └── test_backend.py       # Unit test suite validating schema, AI, & exports
├── requirements.txt          # Python dependencies
├── run.sh                    # One-command startup script
├── DOCUMENTATION.md          # Comprehensive technical & architectural documentation
└── README.md                 # Project overview & user guide
```

For in-depth schema designs, table definitions, and prompt pipelines, see [DOCUMENTATION.md](DOCUMENTATION.md).

---

## 🚀 Setup & Execution

### Prerequisites
- Python 3.10+
- Modern Web Browser (Chrome, Firefox, Safari, Edge)

### Quick Start (One Command)
```bash
./run.sh
```

### Manual Installation
1. Clone or navigate to the repository directory:
   ```bash
   git clone https://github.com/Adityac17/GenCV.git
   cd GenCV
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Launch the application:
   ```bash
   uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

---

## 🔑 Gemini API Configuration

1. **Option A (Environment Variable)**:
   ```bash
   export GEMINI_API_KEY="your-gemini-api-key-here"
   ./run.sh
   ```
2. **Option B (Web UI Settings)**:
   - Navigate to the **Settings** tab in the top navigation.
   - Enter your Gemini API key in the input field and click **Save Settings**.
   - The key is securely saved locally in the SQLite database and masked in the UI.

*Note*: If no API key is provided, the system seamlessly uses its built-in rule-based NLP matcher, ensuring every button and workflow operates smoothly without interruptions.

---

## 📊 Google Sheets Setup Guide

The application is pre-linked to the following Google Spreadsheet:
**[Open Connected Google Spreadsheet](https://docs.google.com/spreadsheets/d/1663le16ErUauJUFrSak8vgA9vY9cLKoAYDw2YosqA70/edit?gid=0#gid=0)** (`ID: 1663le16ErUauJUFrSak8vgA9vY9cLKoAYDw2YosqA70`)

To enable live bidirectional updates:
1. Open the [connected Google Sheet](https://docs.google.com/spreadsheets/d/1663le16ErUauJUFrSak8vgA9vY9cLKoAYDw2YosqA70/edit?gid=0#gid=0) (or any new spreadsheet).
2. Click **Extensions** → **Apps Script**.
3. Copy the script code from `samples/google_apps_script.js` (or click **View Google Apps Script Code** in GenCV's *Google Sheets Sync* tab).
4. Paste the script into the Apps Script editor and save.
5. Click **Deploy** → **New deployment** → Select type: **Web app**.
6. Set **Execute as**: *Me* and **Who has access**: *Anyone*.
7. Copy the generated Web App URL.
8. Paste the URL into the *Google Sheets Webhook URL* field in GenCV and click **Synchronize Database Now**.
9. All 9 portfolio categories will be automatically populated into formatted, color-coded tabs!

---

## 🧪 Testing

Run the automated test suite to verify database persistence, Gemini fallback logic, DOCX generation, and Sheets formatting:
```bash
source .venv/bin/activate
python tests/test_backend.py
```

---

## 📄 Demonstrated Sample Resumes

Two customized resumes generated from the same portfolio are pre-packaged in `samples/`:
1. `Resume_1_Senior_FullStack_AI_Engineer.docx`:
   - Role: **AI Automation Engineer & Full-Stack Developer** at ApexAI Platforms.
   - Highlights: Next.js, Supabase, n8n, Claude Code, Google AI Studio, PostgreSQL, and autonomous lead pipelines.
   - Template: **Modern Tech**.
   - Density: **1-Page Compact**.
2. `Resume_2_Lead_Data_Scientist.docx`:
   - Role: **Systems Software & Full-Stack Engineer** at QIA.
   - Highlights: Modular C++, Python, Graph DSA, Node.js/Express, file I/O, and mathematical SVG engines.
   - Template: **Classic ATS**.
   - Density: **1-Page Compact**.

---

## 👨‍💻 Author & Contact Information

**Aditya Sunil Chouksey**  
*AI Automation Engineer & Full-Stack Developer*  
Bachelor of Technology in Computer Science and Engineering  
**ITM Skills University — School of Future Tech** (Batch 2025–2029)

- **Portfolio**: [portfolio-ad-17.vercel.app](https://portfolio-ad-17.vercel.app)
- **GitHub**: [@Adityac17](https://github.com/Adityac17)
- **LinkedIn**: [linkedin.com/in/adityac17](https://linkedin.com/in/adityac17)
- **Email**: [engineersneotech73@gmail.com](mailto:engineersneotech73@gmail.com) • [2025.adityac@isu.ac.in](mailto:2025.adityac@isu.ac.in)
- **Location**: Navi Mumbai, Maharashtra, India
