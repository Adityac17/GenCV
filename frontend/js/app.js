/**
 * Main Application Orchestrator for GenCV
 * Coordinates views, global state, modals, theme, and notifications.
 */

const App = {
  activeView: 'dashboard',
  apiKey: '',
  portfolio: null,

  async init() {
    this.initTheme();
    this.bindNavigation();
    this.bindModals();
    this.bindSettings();

    // Initialize sub-modules
    Portfolio.init();
    JDMatcher.init();
    ResumeBuilder.init();
    SheetsSync.init();

    // Initial data fetch
    await this.refreshPortfolio();
    await this.refreshHistory();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('gencv_theme') || localStorage.getItem('resumedb_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('gencv_theme', next);
        this.updateThemeIcon(next);
      });
      this.updateThemeIcon(savedTheme);
    }
  },

  updateThemeIcon(theme) {
    const iconContainer = document.getElementById('theme-icon-container');
    if (!iconContainer) return;
    if (theme === 'light') {
      iconContainer.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    } else {
      iconContainer.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
  },

  bindNavigation() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Quick action buttons in dashboard
    document.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = e.currentTarget.dataset.goto;
        this.switchView(targetView);
      });
    });
  },

  switchView(viewName) {
    this.activeView = viewName;
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeSec) {
      activeSec.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  bindModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          this.closeModal(modal.id);
        });
      }
    });
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  bindSettings() {
    const settingsForm = document.getElementById('system-settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const apiKey = document.getElementById('input-gemini-key').value.trim();
        const webhookUrl = document.getElementById('input-sheets-webhook').value.trim();

        try {
          await API.updateSettings({
            gemini_api_key: apiKey,
            google_sheets_webhook_url: webhookUrl
          });
          this.apiKey = apiKey;
          this.showToast('Settings saved successfully', 'success');
          await this.refreshPortfolio();
        } catch (err) {
          this.showToast(`Error saving settings: ${err.message}`, 'error');
        }
      });
    }

    const btnResetData = document.getElementById('btn-reset-sample-data');
    if (btnResetData) {
      btnResetData.addEventListener('click', async () => {
        if (!confirm('Reset portfolio database to initial sample records?')) return;
        try {
          await API.seedPortfolio();
          this.showToast('Database reset to sample records successfully!', 'success');
          await this.refreshPortfolio();
        } catch (err) {
          this.showToast(`Error: ${err.message}`, 'error');
        }
      });
    }
  },

  async refreshPortfolio() {
    try {
      const res = await API.getPortfolio();
      this.portfolio = res.data;
      Portfolio.setData(this.portfolio);
      ResumeBuilder.initDefaultSelections(this.portfolio);
      SheetsSync.updateSyncStatus(this.portfolio.settings);

      // Check API Key status
      const hasKey = this.portfolio.settings?.gemini_api_key_set;
      const apiBadge = document.getElementById('api-status-badge');
      if (apiBadge) {
        if (hasKey) {
          apiBadge.className = 'api-pill';
          apiBadge.innerHTML = `<span class="api-pill-dot"></span> Gemini AI Ready`;
        } else {
          apiBadge.className = 'api-pill missing';
          apiBadge.innerHTML = `<span class="api-pill-dot"></span> Gemini Key (Optional/Fallback Active)`;
        }
      }

      // Populate Settings inputs if present
      const keyInput = document.getElementById('input-gemini-key');
      if (keyInput && this.portfolio.settings?.gemini_api_key_masked) {
        keyInput.placeholder = `Current Key: ${this.portfolio.settings.gemini_api_key_masked}`;
      }

      // Update dashboard candidate name
      const candidateNameEl = document.getElementById('dash-candidate-name');
      const candidateTitleEl = document.getElementById('dash-candidate-title');
      if (candidateNameEl && this.portfolio.personal_info?.full_name) {
        candidateNameEl.textContent = this.portfolio.personal_info.full_name;
      }
      if (candidateTitleEl && this.portfolio.personal_info?.professional_title) {
        candidateTitleEl.textContent = this.portfolio.personal_info.professional_title;
      }
    } catch (err) {
      this.showToast(`Could not load portfolio: ${err.message}`, 'error');
    }
  },

  async refreshHistory() {
    try {
      const res = await API.getResumeHistory();
      const history = res.data || [];
      const container = document.getElementById('resumes-history-list');
      const dashRecent = document.getElementById('dash-recent-resumes');
      
      const elCount = document.getElementById('stat-resumes-count');
      if (elCount) elCount.textContent = history.length;

      if (!container) return;

      if (history.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
            <p style="color: var(--text-muted); margin-bottom: 0.5rem;">No customized resumes saved in history yet.</p>
            <p style="font-size: 0.825rem; color: var(--text-secondary);">Go to the JD Matcher & Studio to tailor and save your first role-specific resume!</p>
          </div>
        `;
        if (dashRecent) {
          dashRecent.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1.5rem;">No resumes generated yet.</p>`;
        }
        return;
      }

      let html = `<div style="display: flex; flex-direction: column; gap: 1rem;">`;
      history.forEach(item => {
        html += `
          <div class="stat-card" style="padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${item.job_title}</h4>
                <div style="font-size: 0.85rem; color: var(--accent-primary); font-weight: 600;">${item.target_company || 'Custom Role'}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Created: ${new Date(item.created_at).toLocaleString()} • Template: ${item.template_name || 'Modern Tech'}</div>
              </div>
              <div style="text-align: right;">
                <span class="item-relevance-badge" style="font-size: 0.85rem; padding: 3px 8px;">${item.match_score || 85}% Match</span>
              </div>
            </div>
            ${item.tailored_summary ? `
              <p style="font-size: 0.825rem; color: var(--text-secondary); margin-top: 0.75rem; line-height: 1.4; border-left: 2px solid var(--accent-primary); padding-left: 0.75rem;">
                ${item.tailored_summary}
              </p>
            ` : ''}
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
              <button class="btn btn-secondary btn-sm" onclick="App.loadResumeFromHistory(${item.id})">Load into Studio</button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      container.innerHTML = html;

      // Populate dashboard recent list
      if (dashRecent) {
        let dashHtml = '';
        history.slice(0, 3).forEach(item => {
          dashHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
              <div>
                <div style="font-size: 0.875rem; font-weight: 600;">${item.job_title}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${item.target_company || 'Custom'} • ${item.match_score || 85}% Match</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="App.loadResumeFromHistory(${item.id})">Open</button>
            </div>
          `;
        });
        dashRecent.innerHTML = dashHtml;
      }
    } catch (err) {
      console.error('Error refreshing history:', err);
    }
  },

  async loadResumeFromHistory(resumeId) {
    try {
      const res = await API.getResumeHistory();
      const history = res.data || [];
      const item = history.find(h => h.id === resumeId);
      if (!item) return;

      this.switchView('studio');
      document.getElementById('jd-role-input').value = item.job_title;
      document.getElementById('jd-textarea').value = item.job_description || '';
      document.getElementById('tailored-summary-input').value = item.tailored_summary || '';

      ResumeBuilder.targetRole = item.job_title;
      ResumeBuilder.tailoredSummary = item.tailored_summary || '';
      ResumeBuilder.renderPreview();
      this.showToast(`Loaded resume configuration for ${item.job_title}`, 'success');
    } catch (err) {
      this.showToast(`Error loading resume: ${err.message}`, 'error');
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    if (type === 'success') {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
