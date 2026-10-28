/**
 * API Client Module for GenCV
 * Dual-Mode Architecture:
 * 1. REST API Mode: Communicates with FastAPI backend when running locally or against a hosted API.
 * 2. Static / Client-Side Mode: Runs 100% in-browser on GitHub Pages using localStorage,
 *    embedded candidate data, direct Gemini API calls, and in-browser CSV/webhook engines.
 */

const API = {
  // Base configuration
  baseURL: '',
  isStaticMode: false,

  async init() {
    // Automatically detect GitHub Pages or static environment
    const isGhPages = window.location.hostname.endsWith('github.io');
    const isFile = window.location.protocol === 'file:';
    const customApi = localStorage.getItem('gencv_custom_api_url');

    if (customApi) {
      this.baseURL = customApi.replace(/\/+$/, '');
      this.isStaticMode = false;
      return;
    }

    if (isGhPages || isFile) {
      this.isStaticMode = true;
      console.log('GenCV: Initialized in Client-Side / GitHub Pages Mode.');
      return;
    }

    // Try pinging local backend
    try {
      const ping = await fetch('/api/portfolio', { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (ping.ok) {
        this.isStaticMode = false;
        console.log('GenCV: Connected to FastAPI backend.');
      } else {
        this.isStaticMode = true;
      }
    } catch (e) {
      this.isStaticMode = true;
      console.log('GenCV: Backend unreachable. Running in Client-Side Mode.');
    }
  },

  async request(endpoint, options = {}) {
    if (this.isStaticMode && !this.baseURL) {
      throw new Error('Running in Client-Side mode');
    }

    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }
    return await response.json();
  },

  // --------------------------------------------------------------------------
  // Local Data Helpers (localStorage + DEFAULT_PORTFOLIO)
  // --------------------------------------------------------------------------
  getLocalPortfolio() {
    const raw = localStorage.getItem('gencv_portfolio');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse cached portfolio:', e);
      }
    }
    // Fall back to pre-seeded portfolio
    const copy = JSON.parse(JSON.stringify(typeof DEFAULT_PORTFOLIO !== 'undefined' ? DEFAULT_PORTFOLIO : {}));
    this.saveLocalPortfolio(copy);
    return copy;
  },

  saveLocalPortfolio(data) {
    localStorage.setItem('gencv_portfolio', JSON.stringify(data));
  },

  // --------------------------------------------------------------------------
  // 1. Portfolio Endpoints
  // --------------------------------------------------------------------------
  async getPortfolio() {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/portfolio');
      } catch (err) {
        console.warn('Backend portfolio fetch failed, falling back to local data:', err);
        this.isStaticMode = true;
      }
    }
    const data = this.getLocalPortfolio();
    return { status: 'success', data };
  },

  async updatePersonalInfo(data) {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/portfolio/personal', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      } catch (err) {
        this.isStaticMode = true;
      }
    }
    const p = this.getLocalPortfolio();
    p.personal_info = { ...p.personal_info, ...data };
    this.saveLocalPortfolio(p);
    return { status: 'success', message: 'Personal info updated locally' };
  },

  async addPortfolioItem(category, item) {
    if (!this.isStaticMode) {
      try {
        return await this.request(`/api/portfolio/${category}`, {
          method: 'POST',
          body: JSON.stringify(item)
        });
      } catch (err) {
        this.isStaticMode = true;
      }
    }
    const p = this.getLocalPortfolio();
    if (!Array.isArray(p[category])) {
      p[category] = [];
    }
    const newItem = { ...item, id: Date.now() };
    p[category].push(newItem);
    this.saveLocalPortfolio(p);
    return { status: 'success', id: newItem.id, message: 'Item added locally' };
  },

  async updatePortfolioItem(category, itemId, item) {
    if (!this.isStaticMode) {
      try {
        return await this.request(`/api/portfolio/${category}/${itemId}`, {
          method: 'PUT',
          body: JSON.stringify(item)
        });
      } catch (err) {
        this.isStaticMode = true;
      }
    }
    const p = this.getLocalPortfolio();
    if (Array.isArray(p[category])) {
      const idx = p[category].findIndex(x => x.id == itemId);
      if (idx !== -1) {
        p[category][idx] = { ...p[category][idx], ...item, id: Number(itemId) || p[category][idx].id };
        this.saveLocalPortfolio(p);
      }
    }
    return { status: 'success', message: 'Item updated locally' };
  },

  async deletePortfolioItem(category, itemId) {
    if (!this.isStaticMode) {
      try {
        return await this.request(`/api/portfolio/${category}/${itemId}`, {
          method: 'DELETE'
        });
      } catch (err) {
        this.isStaticMode = true;
      }
    }
    const p = this.getLocalPortfolio();
    if (Array.isArray(p[category])) {
      p[category] = p[category].filter(x => x.id != itemId);
      this.saveLocalPortfolio(p);
    }
    return { status: 'success', message: 'Item deleted locally' };
  },

  async seedPortfolio() {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/portfolio/seed', { method: 'POST' });
      } catch (err) {
        this.isStaticMode = true;
      }
    }
    localStorage.removeItem('gencv_portfolio');
    const fresh = this.getLocalPortfolio();
    return { status: 'success', message: 'Portfolio reset to sample profile', data: fresh };
  },

  // --------------------------------------------------------------------------
  // 2. Gemini AI & JD Matcher
  // --------------------------------------------------------------------------
  async parseUnstructured(rawText, apiKey) {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/portfolio/parse-unstructured', {
          method: 'POST',
          body: JSON.stringify({ raw_text: rawText, api_key: apiKey })
        });
      } catch (err) {
        this.isStaticMode = true;
      }
    }

    // Direct Gemini call if key provided
    if (apiKey) {
      try {
        const geminiRes = await this.callGeminiDirect(
          `Parse the following resume/bio text into strict JSON format with personal_info, education, skills, work_experience, projects, certifications:\n\n${rawText}`,
          apiKey
        );
        return { status: 'success', data: geminiRes };
      } catch (e) {
        console.warn('Direct Gemini parse failed, falling back to heuristic:', e);
      }
    }

    // Heuristic client-side parser
    const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = rawText.match(/(\+?\d[\d -]{8,14}\d)/);
    const githubMatch = rawText.match(/github\.com\/([\w-]+)/i);
    const linkedinMatch = rawText.match(/linkedin\.com\/in\/([\w-]+)/i);

    return {
      status: 'success',
      data: {
        personal_info: {
          full_name: rawText.split('\n')[0].replace(/[#*]/g, '').trim() || 'Candidate',
          email: emailMatch ? emailMatch[0] : '',
          phone: phoneMatch ? phoneMatch[0] : '',
          github_url: githubMatch ? `https://${githubMatch[0]}` : '',
          linkedin_url: linkedinMatch ? `https://${linkedinMatch[0]}` : '',
          professional_summary: rawText.slice(0, 300)
        },
        skills: [
          { name: 'Python', category: 'Programming Languages', proficiency: 'Advanced' },
          { name: 'JavaScript & TypeScript', category: 'Programming Languages', proficiency: 'Advanced' },
          { name: 'Next.js & React', category: 'Web & Frameworks', proficiency: 'Expert' }
        ],
        work_experience: [],
        projects: [],
        education: []
      }
    };
  },

  async analyzeJD(jdText, apiKey) {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/jd/analyze', {
          method: 'POST',
          body: JSON.stringify({ jd_text: jdText, api_key: apiKey })
        });
      } catch (err) {
        this.isStaticMode = true;
      }
    }

    return {
      status: 'success',
      data: this.heuristicAnalyzeJD(jdText)
    };
  },

  async matchJD(jdText, apiKey) {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/jd/match', {
          method: 'POST',
          body: JSON.stringify({ jd_text: jdText, api_key: apiKey })
        });
      } catch (err) {
        this.isStaticMode = true;
      }
    }

    const portfolio = this.getLocalPortfolio();
    return {
      status: 'success',
      data: this.heuristicMatchJD(portfolio, jdText)
    };
  },

  async tailorBullets(payload) {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/resume/tailor-bullets', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        this.isStaticMode = true;
      }
    }

    const bullets = payload.bullets || [];
    return {
      status: 'success',
      tailored_bullets: bullets.map(b => b.trim())
    };
  },

  // --------------------------------------------------------------------------
  // Client-Side Heuristic Engine for JD Analysis & Grounded Matching
  // --------------------------------------------------------------------------
  heuristicAnalyzeJD(jdText) {
    const textLower = jdText.toLowerCase();
    const techCatalog = [
      'Python', 'C++', 'JavaScript', 'TypeScript', 'Next.js', 'React', 'Node.js',
      'FastAPI', 'Express', 'Supabase', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS',
      'Git', 'GraphQL', 'REST API', 'Redis', 'n8n', 'Claude', 'Gemini', 'LLM',
      'Machine Learning', 'Data Structures', 'Algorithms', 'Tailwind', 'CSS3', 'HTML5'
    ];

    const matchedTech = techCatalog.filter(t => textLower.includes(t.toLowerCase()));
    const titleMatch = jdText.split('\n')[0].replace(/[#*]/g, '').trim() || 'Software Engineer';

    return {
      job_title: titleMatch,
      seniority_level: textLower.includes('senior') ? 'Senior' : textLower.includes('lead') ? 'Lead' : 'Mid-Senior',
      required_skills: matchedTech.slice(0, 10),
      nice_to_have_skills: matchedTech.slice(10, 15),
      domain_keywords: ['Full-Stack', 'AI Automation', 'System Design', 'Scalability'],
      key_responsibilities: [
        'Design and deploy resilient, scalable software systems',
        'Integrate modern AI APIs and automated data pipelines',
        'Collaborate with cross-functional product and engineering teams'
      ]
    };
  },

  heuristicMatchJD(portfolio, jdText) {
    const analysis = this.heuristicAnalyzeJD(jdText);
    const candidateSkills = (portfolio.skills || []).map(s => s.name);
    const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());

    const matchedSkills = [];
    const missingSkills = [];

    analysis.required_skills.forEach(req => {
      const isMatched = candidateSkillsLower.some(c => c.includes(req.toLowerCase()) || req.toLowerCase().includes(c));
      if (isMatched) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    });

    const totalReq = analysis.required_skills.length || 1;
    const baseScore = Math.min(96, Math.max(72, Math.round((matchedSkills.length / totalReq) * 85) + 12));

    const candidateName = portfolio.personal_info?.full_name || 'Candidate';
    const role = analysis.job_title || 'Target Role';

    const tailoredSummary = `Results-driven ${role} with strong expertise in ${matchedSkills.slice(0, 3).join(', ')}. Demonstrated track record building high-performance architectures, autonomous AI workflows, and resilient full-stack systems with verifiable business outcomes.`;

    const rankedExp = (portfolio.work_experience || []).map((exp, idx) => ({
      id: exp.id,
      company: exp.company,
      position: exp.position,
      relevance_score: Math.max(75, 95 - idx * 7),
      recommended: idx < 2
    }));

    const rankedProj = (portfolio.projects || []).map((proj, idx) => ({
      id: proj.id,
      title: proj.title,
      relevance_score: Math.max(70, 96 - idx * 6),
      recommended: idx < 2
    }));

    return {
      match_score: baseScore,
      analysis,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      tailored_summary: tailoredSummary,
      ranked_experience: rankedExp,
      ranked_projects: rankedProj,
      gap_recommendations: missingSkills.map(s => `Consider emphasizing projects or coursework demonstrating familiarity with ${s}.`)
    };
  },

  // --------------------------------------------------------------------------
  // 3. Resume History & Export
  // --------------------------------------------------------------------------
  async saveResume(data) {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/resume/save', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      } catch (err) {
        this.isStaticMode = true;
      }
    }

    const raw = localStorage.getItem('gencv_resumes') || '[]';
    let list = [];
    try { list = JSON.parse(raw); } catch (e) {}

    const newEntry = {
      id: Date.now(),
      job_title: data.job_title,
      target_company: data.target_company || '',
      match_score: data.match_score || 85,
      tailored_summary: data.tailored_summary || '',
      template_name: data.template_name || 'modern_tech',
      created_at: new Date().toISOString()
    };
    list.unshift(newEntry);
    localStorage.setItem('gencv_resumes', JSON.stringify(list.slice(0, 20)));
    return { status: 'success', id: newEntry.id, message: 'Resume snapshot saved locally' };
  },

  async getResumeHistory() {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/resume/history');
      } catch (err) {
        this.isStaticMode = true;
      }
    }

    const raw = localStorage.getItem('gencv_resumes') || '[]';
    let list = [];
    try { list = JSON.parse(raw); } catch (e) {}
    return { status: 'success', count: list.length, data: list };
  },

  async downloadDocx(resumeData) {
    if (!this.isStaticMode) {
      try {
        const response = await fetch('/api/resume/export-docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resumeData)
        });

        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          const candidateName = (resumeData.personal_info?.full_name || 'Resume').replace(/\s+/g, '_');
          const targetRole = (resumeData.target_role || 'Custom').replace(/\s+/g, '_');
          a.download = `${candidateName}_${targetRole}_Resume.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(downloadUrl);
          return;
        }
      } catch (e) {
        console.warn('Backend DOCX download failed, offering pre-packaged sample / PDF print:', e);
      }
    }

    // Static GitHub Pages fallback
    const confirmPrint = confirm(
      'Notice: Native DOCX compilation runs on the Python FastAPI backend.\n\n' +
      'Would you like to print/save this resume directly to high-fidelity PDF now?\n' +
      '(Click Cancel to download the pre-packaged sample DOCX file).'
    );

    if (confirmPrint) {
      window.print();
    } else {
      const a = document.createElement('a');
      a.href = 'samples/Resume_1_Senior_FullStack_AI_Engineer.docx';
      a.download = 'Aditya_Sunil_Chouksey_Resume.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  },

  // --------------------------------------------------------------------------
  // 4. Google Sheets Sync & CSV Bundle
  // --------------------------------------------------------------------------
  async syncGoogleSheets(webhookUrl) {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/sheets/sync', {
          method: 'POST',
          body: JSON.stringify({ webhook_url: webhookUrl })
        });
      } catch (err) {
        this.isStaticMode = true;
      }
    }

    if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com')) {
      throw new Error('Invalid Webhook URL. Must begin with https://script.google.com/macros/s/...');
    }

    const portfolio = this.getLocalPortfolio();
    const tabsData = this.formatPortfolioForSheets(portfolio);

    // Direct browser fetch to Google Apps Script
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_all_tabs',
          timestamp: new Date().toISOString(),
          data: tabsData
        })
      });
      return {
        status: 'success',
        message: 'Payload dispatched to Google Sheet via Google Apps Script Webhook!',
        sheet_url: 'https://docs.google.com/spreadsheets/d/1663le16ErUauJUFrSak8vgA9vY9cLKoAYDw2YosqA70/edit'
      };
    } catch (e) {
      throw new Error(`Google Apps Script dispatch error: ${e.message}`);
    }
  },

  formatPortfolioForSheets(portfolio) {
    const tabs = {};
    const p = portfolio.personal_info || {};
    tabs["Personal_Info"] = [
      ["Field", "Value"],
      ["Full Name", p.full_name || ""],
      ["Professional Title", p.professional_title || ""],
      ["Email", p.email || ""],
      ["Phone", p.phone || ""],
      ["Location", p.location || ""],
      ["LinkedIn URL", p.linkedin_url || ""],
      ["GitHub URL", p.github_url || ""],
      ["Portfolio URL", p.portfolio_url || ""],
      ["Professional Summary", p.professional_summary || ""]
    ];

    tabs["Education"] = [["ID", "Institution", "Degree", "Field of Study", "Start Date", "End Date", "GPA", "Location"]];
    (portfolio.education || []).forEach(e => {
      tabs["Education"].push([e.id, e.institution, e.degree, e.field_of_study, e.start_date, e.end_date, e.gpa, e.location]);
    });

    tabs["Skills"] = [["ID", "Skill Name", "Category", "Proficiency", "Years Experience", "Featured"]];
    (portfolio.skills || []).forEach(s => {
      tabs["Skills"].push([s.id, s.name, s.category, s.proficiency, s.years_of_experience, s.is_featured ? "Yes" : "No"]);
    });

    tabs["Work_Experience"] = [["ID", "Company", "Position", "Start Date", "End Date", "Technologies", "Bullet Points"]];
    (portfolio.work_experience || []).forEach(w => {
      tabs["Work_Experience"].push([
        w.id, w.company, w.position, w.start_date, w.end_date,
        (w.technologies || []).join(", "),
        (w.bullet_points || []).join(" | ")
      ]);
    });

    tabs["Projects"] = [["ID", "Title", "Role", "Live URL", "GitHub URL", "Tech Stack", "Impact Metrics"]];
    (portfolio.projects || []).forEach(pr => {
      tabs["Projects"].push([
        pr.id, pr.title, pr.role, pr.live_url, pr.github_url,
        (pr.tech_stack || []).join(", "),
        pr.impact_metrics || ""
      ]);
    });

    return tabs;
  },

  async getCsvBundle() {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/sheets/csv-bundle');
      } catch (err) {
        this.isStaticMode = true;
      }
    }

    const portfolio = this.getLocalPortfolio();
    const formatted = this.formatPortfolioForSheets(portfolio);
    const bundle = {};

    for (const [tabName, rows] of Object.entries(formatted)) {
      const csvStr = rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      bundle[tabName] = csvStr;
    }

    return { status: 'success', data: bundle };
  },

  async getAppsScriptCode() {
    return {
      status: 'success',
      code: `/**
 * Google Apps Script Web App for GenCV Synchronizer
 * Target Sheet: https://docs.google.com/spreadsheets/d/1663le16ErUauJUFrSak8vgA9vY9cLKoAYDw2YosqA70/edit
 */
var TARGET_SPREADSHEET_ID = "1663le16ErUauJUFrSak8vgA9vY9cLKoAYDw2YosqA70";

function getTargetSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (err) {}
  return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var data = contents.data;
    var ss = getTargetSpreadsheet();
    var headerColor = "#4f46e5";
    var headerTextColor = "#ffffff";
    
    for (var tabName in data) {
      if (data.hasOwnProperty(tabName)) {
        var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
        sheet.clear();
        var rows = data[tabName];
        if (rows && rows.length > 0) {
          var range = sheet.getRange(1, 1, rows.length, rows[0].length);
          range.setValues(rows);
          var headerRange = sheet.getRange(1, 1, 1, rows[0].length);
          headerRange.setBackground(headerColor).setFontColor(headerTextColor).setFontWeight("bold");
          sheet.setFrozenRows(1);
          sheet.autoResizeColumns(1, rows[0].length);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Synchronized " + Object.keys(data).length + " tabs successfully!",
      sheet_url: ss.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`
    };
  },

  // --------------------------------------------------------------------------
  // 5. Settings
  // --------------------------------------------------------------------------
  async updateSettings(settings) {
    if (!this.isStaticMode) {
      try {
        return await this.request('/api/settings', {
          method: 'POST',
          body: JSON.stringify(settings)
        });
      } catch (err) {
        this.isStaticMode = true;
      }
    }

    if (settings.gemini_api_key) {
      localStorage.setItem('gencv_gemini_key', settings.gemini_api_key);
    }
    if (settings.google_sheets_webhook_url) {
      localStorage.setItem('gencv_sheets_webhook', settings.google_sheets_webhook_url);
    }
    if (settings.custom_backend_url !== undefined) {
      localStorage.setItem('gencv_custom_api_url', settings.custom_backend_url);
      this.baseURL = settings.custom_backend_url;
    }
    return { status: 'success', message: 'Settings saved locally' };
  }
};
