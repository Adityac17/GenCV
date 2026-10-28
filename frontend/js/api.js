/**
 * API Client Module for GenCV
 * Interacts with FastAPI backend REST endpoints.
 */

const API = {
  // Base configuration
  baseURL: '',

  async request(endpoint, options = {}) {
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

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // 1. Portfolio Endpoints
  async getPortfolio() {
    return this.request('/api/portfolio');
  },

  async updatePersonalInfo(data) {
    return this.request('/api/portfolio/personal', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async addPortfolioItem(category, item) {
    return this.request(`/api/portfolio/${category}`, {
      method: 'POST',
      body: JSON.stringify(item)
    });
  },

  async updatePortfolioItem(category, itemId, item) {
    return this.request(`/api/portfolio/${category}/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(item)
    });
  },

  async deletePortfolioItem(category, itemId) {
    return this.request(`/api/portfolio/${category}/${itemId}`, {
      method: 'DELETE'
    });
  },

  async seedPortfolio() {
    return this.request('/api/portfolio/seed', {
      method: 'POST'
    });
  },

  // 2. Gemini AI Endpoints
  async parseUnstructured(rawText, apiKey) {
    return this.request('/api/portfolio/parse-unstructured', {
      method: 'POST',
      body: JSON.stringify({ raw_text: rawText, api_key: apiKey })
    });
  },

  async analyzeJD(jdText, apiKey) {
    return this.request('/api/jd/analyze', {
      method: 'POST',
      body: JSON.stringify({ jd_text: jdText, api_key: apiKey })
    });
  },

  async matchJD(jdText, apiKey) {
    return this.request('/api/jd/match', {
      method: 'POST',
      body: JSON.stringify({ jd_text: jdText, api_key: apiKey })
    });
  },

  async tailorBullets(payload) {
    return this.request('/api/resume/tailor-bullets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // 3. Resume History & DOCX Export
  async saveResume(data) {
    return this.request('/api/resume/save', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getResumeHistory() {
    return this.request('/api/resume/history');
  },

  async downloadDocx(resumeData) {
    const response = await fetch('/api/resume/export-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resumeData)
    });

    if (!response.ok) {
      throw new Error(`DOCX Export failed: ${response.statusText}`);
    }

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
  },

  // 4. Google Sheets Sync
  async syncGoogleSheets(webhookUrl) {
    return this.request('/api/sheets/sync', {
      method: 'POST',
      body: JSON.stringify({ webhook_url: webhookUrl })
    });
  },

  async getCsvBundle() {
    return this.request('/api/sheets/csv-bundle');
  },

  async getAppsScriptCode() {
    return this.request('/api/sheets/apps-script-code');
  },

  // 5. Settings
  async updateSettings(settings) {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }
};
