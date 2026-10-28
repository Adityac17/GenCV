# GenCV: Comprehensive Technical & Architectural Documentation

This document provides an exhaustive technical breakdown of **GenCV**, an AI-powered portfolio management and dynamic resume tailoring system. It satisfies all documentation requirements of the assignment.

---

## 1. System Architecture

GenCV follows a decoupled, layered client-server architecture designed for high availability, zero layout shifts, local data sovereignty, and reliable AI augmentation.

### Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                                  Client Browser                                   |
|   +---------------------------------------------------------------------------+   |
|   |   Single Page Application (SPA): Vanilla HTML5 + CSS3 + Modular ES6 JS    |   |
|   |   - Dashboard & Quick Actions                                             |   |
|   |   - Portfolio Database CRUD & AI Unstructured Text Importer              |   |
|   |   - Job Description Matcher, Gauge & Keyword Highlighter                  |   |
|   |   - Dynamic Resume Studio (Density, Emphasis, Section Order, Templates)   |   |
|   |   - Google Sheets Connector & Multi-Tab CSV Exporter                      |   |
|   |   - Saved Resumes History & Snapshot Comparator                           |   |
|   +---------------------------------------------------------------------------+   |
+----------------------------------------|------------------------------------------+
                                         | REST API (JSON / HTTP)
                                         v
+-----------------------------------------------------------------------------------+
|                             FastAPI Backend Service                               |
|   +-------------------+  +--------------------+  +----------------------------+   |
|   | App Router & APIs |  | Gemini AI Service  |  | Google Sheets Service      |   |
|   | (/api/portfolio)  |  | - Parser           |  | - Apps Script Webhook Sync |   |
|   | (/api/jd/match)   |  | - JD Analyzer      |  | - Multi-Tab 2D Formatter   |   |
|   | (/api/resume/*)   |  | - Grounded Matcher |  | - CSV Bundle Generator     |   |
|   | (/api/sheets/*)   |  | - Heuristic Fallback|                              |   |
|   +-------------------+  +--------------------+  +----------------------------+   |
|             |                       |                           |                 |
|             v                       v                           v                 |
|   +-------------------+  +--------------------+  +----------------------------+   |
|   | SQLite Database   |  | Google Gemini API  |  | Google Sheets / Apps Script|   |
|   | (portfolio.db)    |  | (1.5 Flash / Pro)  |  | (External Live Spreadsheet)|   |
|   +-------------------+  +--------------------+  +----------------------------+   |
|             |                                                                     |
|             v                                                                     |
|   +-------------------------------------------+                                   |
|   | Native Word (.docx) Engine (python-docx)  |                                   |
|   | - ATS-Compliant Custom Formatting         |                                   |
|   | - Automated Quantitative Metric Bolding   |                                   |
|   | - 1-Page Compact Layout & Custom Ordering |                                   |
|   +-------------------------------------------+                                   |
+-----------------------------------------------------------------------------------+
```

### Component Breakdown
1. **Frontend Presentation Layer (`frontend/`)**:
   - Zero-dependency architecture (Vanilla CSS + ES6 JavaScript).
   - Designed strictly according to `ui-ux-pro-max` anti-slop guidelines: Obsidian & Slate monochromatic dark mode (`#080a0f`), 8pt grid, WCAG AAA contrast, custom scrollbars, and tactile state feedback.
   - Live Resume Studio featuring dynamic parameter modification: 1-Page Compact vs Detailed density, Technical vs Leadership emphasis, interactive section reordering, and template switching.
2. **Backend API Layer (`backend/app.py`)**:
   - Asynchronous Python web framework built on FastAPI and Uvicorn.
   - Exposes RESTful endpoints for database operations, AI processing, sheet synchronization, and document exports.
3. **Database Layer (`backend/database.py`)**:
   - Local relational SQLite database (`portfolio.db`) ensuring data privacy and zero cloud dependencies for basic usage.
4. **AI Intelligence Engine (`backend/gemini_service.py`)**:
   - Orchestrates LLM calls to Google Gemini (`gemini-1.5-flash` / `gemini-1.5-pro`).
   - Implements strict anti-hallucination verification and zero-failure rule-based NLP fallbacks.
5. **Document Synthesis Engines**:
   - **PDF Generation**: Browser-native print engine styled via `@media print` rules in `frontend/css/resume_templates.css`.
   - **Word (.docx) Generation**: Python server-side generator in `backend/docx_generator.py` utilizing `python-docx` with XML cell padding, custom dividers, and regex-powered metric highlighting.

---

## 2. Database Schema Design

The database is built on SQLite with relational normalization, foreign key integrity, and timestamps.

### Entity Relationship Model

```
                    +---------------------------+
                    |       personal_info       |
                    | (Primary Candidate Data)  |
                    +---------------------------+
                                  |
    +-------------+---------------+-------------+--------------+
    |             |               |             |              |
    v             v               v             v              v
+-------+   +-----------+   +----------+   +----------+   +---------+
|skills |   |work_exp   |   |projects  |   |education |   |certs    |
+-------+   +-----------+   +----------+   +----------+   +---------+
    |             |               |             |              |
    +-------------+---------------+-------------+--------------+
                                  |
          +-----------------------+-----------------------+
          |                       |                       |
          v                       v                       v
    +------------+        +---------------+        +--------------+
    |achievements|        | publications  |        |  languages   |
    +------------+        +---------------+        +--------------+
```

### Table Definitions & Data Dictionary

#### 1. `personal_info`
Maintains foundational contact details and executive summaries.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY CHECK (id = 1) | Singleton record pattern |
| `full_name` | TEXT | NOT NULL | Candidate's complete legal name |
| `professional_title`| TEXT | | Default career title |
| `email` | TEXT | NOT NULL | Primary contact email address |
| `phone` | TEXT | | Phone number with country code |
| `location` | TEXT | | Geographic location & remote status |
| `linkedin_url` | TEXT | | Full LinkedIn profile URL |
| `github_url` | TEXT | | GitHub repository handle or link |
| `portfolio_url` | TEXT | | Personal website / portfolio link |
| `career_objective` | TEXT | | Long-term career vision |
| `professional_summary`| TEXT | | Default executive overview |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification date |

#### 2. `education`
Stores degrees, universities, and academic coursework.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique educational ID |
| `institution` | TEXT | NOT NULL | University / College name |
| `degree` | TEXT | NOT NULL | B.Tech, MS, BS, etc. |
| `field_of_study` | TEXT | | Academic major / concentration |
| `start_date` | TEXT | | Start date (YYYY-MM) |
| `end_date` | TEXT | | Graduation date or Expected |
| `gpa` | TEXT | | Cumulative GPA or honors score |
| `highlights` | TEXT | | Dean's list, awards, coursework |
| `location` | TEXT | | Campus city, country |
| `order_index` | INTEGER | DEFAULT 0 | Custom display order |

#### 3. `skills`
Stores categorized technical and soft competencies.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique skill ID |
| `name` | TEXT | NOT NULL | Skill name (e.g. Next.js, C++) |
| `category` | TEXT | NOT NULL | Languages, Frameworks, AI, etc. |
| `proficiency` | TEXT | NOT NULL | Beginner, Intermediate, Advanced, Expert |
| `years_of_experience`| REAL | | Numerical years practiced |
| `is_featured` | INTEGER | DEFAULT 0 | 1 = Highlighted on resume |
| `order_index` | INTEGER | DEFAULT 0 | Display priority |

#### 4. `work_experience`
Stores employment, freelance roles, and founder builds.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique job ID |
| `company` | TEXT | NOT NULL | Organization / Company name |
| `position` | TEXT | NOT NULL | Title held |
| `employment_type` | TEXT | | Full-time, Founder, Freelance |
| `location` | TEXT | | Office city or Remote |
| `start_date` | TEXT | NOT NULL | Start date (YYYY-MM) |
| `end_date` | TEXT | | End date or Present |
| `is_current` | INTEGER | DEFAULT 0 | 1 = Currently working here |
| `description` | TEXT | | High-level role overview |
| `bullet_points` | TEXT | | JSON array of quantifiable bullets |
| `technologies` | TEXT | | JSON array of tools used |
| `order_index` | INTEGER | DEFAULT 0 | Chronological order |

#### 5. `projects`
Stores software systems, open-source repos, and academic builds.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique project ID |
| `title` | TEXT | NOT NULL | Project or system name |
| `role` | TEXT | | Creator, Lead Architect, etc. |
| `start_date` | TEXT | | Project start (YYYY-MM) |
| `end_date` | TEXT | | Project completion date |
| `live_url` | TEXT | | Public deployment URL |
| `github_url` | TEXT | | Source code repository |
| `description` | TEXT | | Core architectural summary |
| `bullet_points` | TEXT | | JSON array of accomplishment bullets |
| `tech_stack` | TEXT | | JSON array of technologies |
| `impact_metrics` | TEXT | | Quantifiable metrics & awards |
| `order_index` | INTEGER | DEFAULT 0 | Display sequence |

#### 6. Auxiliary Tables: `certifications`, `achievements`, `publications`, `languages`
All auxiliary tables follow identical high-durability schemas with primary keys, descriptive attributes, credential links, and ordering indexes.

#### 7. `generated_resumes`
Provides historical resume versioning and snapshot restoration.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique snapshot ID |
| `job_title` | TEXT | NOT NULL | Target role for this resume |
| `target_company` | TEXT | | Target company name |
| `job_description` | TEXT | | Job description text matched |
| `match_score` | INTEGER | | Match percentage (0–100%) |
| `tailored_summary` | TEXT | | Generated executive summary |
| `selected_data` | TEXT | NOT NULL | JSON payload of included IDs & bullets |
| `template_name` | TEXT | NOT NULL | Selected visual template |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Snapshot creation timestamp |

---

## 3. Gemini API Integration Across Lifecycle Stages

The Gemini API is integrated at four distinct stages with tailored system instructions and strict validation.

### Stage 1: Unstructured Portfolio Parsing
- **Function**: `parse_unstructured_portfolio(raw_text)` in [gemini_service.py](file:///Users/adityac17/Documents/Resume-DB/backend/gemini_service.py#L115-L212).
- **Prompt Engineering**: The model acts as an executive data extraction engine. It takes raw, unstructured text (such as unformatted LinkedIn profile exports, rough notes, or legacy resumes) and maps the entities into a structured JSON schema covering all 9 portfolio categories.
- **Output Validation**: Responses are cleaned via `clean_json_response()` to strip markdown fences, validate syntax, and guarantee compatibility with database insert helpers.

### Stage 2: Job Description Deep Analysis
- **Function**: `analyze_job_description(jd_text)` in [gemini_service.py](file:///Users/adityac17/Documents/Resume-DB/backend/gemini_service.py#L214-L248).
- **Prompt Engineering**: Analyzes the raw Job Description text to isolate:
  - Extracted job title and company name.
  - Seniority tier (Entry, Mid, Senior, Lead/Staff, Principal).
  - Required vs preferred technical skills.
  - Soft skills and leadership expectations.
  - Domain keywords (e.g. `n8n`, `Next.js`, `REST API`, `High-Throughput`).
  - Key responsibilities and a 2-sentence summary of the ideal candidate.

### Stage 3: Portfolio vs JD Matcher & Gap Analysis
- **Function**: `match_portfolio_with_jd(portfolio, jd_text)` in [gemini_service.py](file:///Users/adityac17/Documents/Resume-DB/backend/gemini_service.py#L250-L369).
- **Matching Algorithm**:
  1. Computes an aggregate **Match Score (0–100%)** based on weighted sub-scores:
     - Skills Alignment: 40%
     - Experience Depth: 30%
     - Project Relevance: 20%
     - Education & Certifications: 10%
  2. Categorizes skills into **Direct Matches** (skills present in both candidate database and JD) and **Skill Gaps** (skills in JD that candidate lacks, alongside actionable suggestions).
  3. Recommends the top 2 most relevant projects and top 2 work experiences with contextual reasoning.

### Stage 4: Grounded Bullet Point & Summary Tailoring (Strict Anti-Hallucination)
- **Functions**: `tailor_bullet_points()` and `match_portfolio_with_jd()`.
- **Anti-Hallucination Guarantee**:
  - The prompt enforces an absolute negative constraint: *"CRITICAL REQUIREMENT: AI-generated information must be verified against the original portfolio data. The system must NEVER invent qualifications, skills, certifications, or work experience. Every claim in the tailored summary and recommendations MUST be 100% grounded in the candidate's actual portfolio."*
  - Refined bullet points must preserve the verified metrics (e.g., `5,000+ leads`, `sub-second latency`) while restructuring the sentence using strong active verbs and weaving in relevant target keywords.
- **Zero-Failure Local Heuristic Fallback**:
  - If the user has not configured a Gemini API key or the network is unavailable, the system automatically falls back to local heuristic functions (`local_heuristic_parse`, `local_heuristic_jd_analysis`, `local_heuristic_matcher`). This guarantees zero crashes and uninterrupted demonstration capabilities.

---

## 4. Google Sheets Integration Approach

To meet the requirement of exporting the portfolio database to a structured Google Sheet and maintaining live synchronization, GenCV implements a dual-path integration:

### Approach A: Live Multi-Tab Google Apps Script Webhook (Recommended)
1. **Architecture**: A serverless Google Apps Script is deployed as a Web App bound to the user's target Google Sheet.
2. **Data Dispatch**: When the user clicks **Synchronize Database Now** in the UI (or triggers `POST /api/sheets/sync-apps-script`), the backend formats the entire SQLite database into 9 distinct 2D array tables.
3. **Multi-Tab Layout**: The Apps Script (`samples/google_apps_script.js`) receives the JSON payload and automatically:
   - Creates or updates 9 dedicated, labeled tabs:
     - `Personal_Info` (Two-column key-value layout)
     - `Skills` (Categorized with proficiency and experience columns)
     - `Work_Experience` (Company, role, dates, bullets, tech stack)
     - `Projects` (Title, live URLs, GitHub links, impact metrics)
     - `Education` (Institutions, degrees, GPAs, coursework)
     - `Certifications` (Names, issuers, dates, credential URLs)
     - `Achievements` (Honors, dates, descriptions)
     - `Publications` (Titles, conferences, links)
     - `Languages` (Language, fluency tier)
   - Applies styling: dark slate header rows (`#0f172a`), bold white text, auto-resized column widths, and frozen header panes.

### Approach B: Universal Multi-Tab CSV Bundle
- For users without Google Workspace access, `GET /api/sheets/export-csv-bundle` packages all 9 categories into separate CSV tables, enabling import into any spreadsheet tool (Microsoft Excel, LibreOffice, Apple Numbers, Google Sheets).

---

## 5. Dynamic Resume Generation & Customization Workflow

GenCV provides an interactive studio where users customize resumes in real-time before downloading.

### Interactive Customization Parameters
1. **Density Switch (1-Page Compact vs Detailed 2-Page)**:
   - **1-Page Compact (Default)**: Automatically curates content to the top 2 roles (2 metric bullets each), top 2 projects (2 metric bullets each), top 8–10 skills, and a concise 2-sentence summary (~320 words). Fits standard 1-page recruiter requirements.
   - **Detailed (2-Page)**: Comprehensive multi-page view for extensive portfolios or academic CVs.
2. **Emphasis Selector (Technical vs Leadership vs Balanced)**:
   - **Technical**: Filters and prioritizes programming languages, backend frameworks, data structures, and code-level performance metrics.
   - **Leadership**: Prioritizes systems architecture, pipeline ownership, founder builds, and team impact.
   - **Balanced**: Provides an evenly distributed overview across all competencies.
3. **Section Layout Reordering**:
   - Allows users to dynamically reorder sections (Summary, Technical Expertise, Professional Experience, Key Projects, Education & Certifications) using intuitive Move Up / Move Down controls.
   - Both the HTML live preview and the exported Word (.docx) document dynamically respect this customized section order.
4. **Granular Checkbox Matrix**:
   - Check or uncheck individual positions, projects, skills, or even individual bullet points.
5. **Template Switcher**:
   - **Modern Tech**: Accent typography, skill groupings, high scannability.
   - **Classic ATS**: Single-column, conservative, high-contrast black-and-white.
   - **Minimalist Executive**: Editorial typography with elegant dividers.

### Export Verification
- **Word (.docx) Export**: Built using `python-docx` with custom XML padding, 0.5-inch compact margins, and automatic bolding of quantitative metrics (e.g. `5,000+`, `92%`, `150,000+`).
- **PDF Export**: Configured via CSS print stylesheets (`@media print`) for clean pagination without unwanted blank pages.

---

## 6. Demonstrated Sample Resumes Summary

Two distinct resumes generated from the same portfolio are pre-compiled and verified in `samples/`:

| Attribute | Sample Resume 1 | Sample Resume 2 |
| :--- | :--- | :--- |
| **Filename** | [Resume_1_Senior_FullStack_AI_Engineer.docx](file:///Users/adityac17/Documents/Resume-DB/samples/Resume_1_Senior_FullStack_AI_Engineer.docx) | [Resume_2_Lead_Data_Scientist.docx](file:///Users/adityac17/Documents/Resume-DB/samples/Resume_2_Lead_Data_Scientist.docx) |
| **Target Role** | AI Automation Engineer & Full-Stack Developer | Systems Software & Full-Stack Engineer |
| **Target Company** | ApexAI Platforms | Quantitative Intelligence Analytics (QIA) |
| **Emphasis** | Autonomous Agentic Workflows & Web Apps | Systems Software, C++ & Graph Algorithms |
| **Featured Stack** | Next.js, Supabase, n8n, Claude Code, Python, REST APIs | Modular C++, Python, Graph DSA, Node.js, File I/O |
| **Featured Projects**| AI Lead-Gen CRM Suite, Dynamic SVG Editor, KidSafe Ride Tracker | Smart Global Supply Chain Risk Management, Dynamic SVG Editor |
| **Template Used** | Modern Tech | Classic ATS |
| **Density** | 1-Page Compact (~320 words) | 1-Page Compact (~310 words) |
| **Verified DOCX Size** | 38.7 KB | 38.6 KB |
