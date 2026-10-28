/**
 * Dynamic Resume Builder & Live Preview Controller (Scannability & Density Optimized)
 * Solves the "wall of text" problem by providing 1-Page Compact mode (default)
 * with curated punchy bullets, bold metrics, and instant recruiter scannability.
 */

const ResumeBuilder = {
  activeTemplate: 'template-modern-tech',
  densityMode: 'compact', // 'compact' (1-page optimal, ~320 words) vs 'detailed' (2-page, ~650 words)
  emphasis: 'technical',  // 'technical' vs 'leadership' vs 'balanced'
  sectionOrder: ['summary', 'skills', 'experience', 'projects', 'education'],
  sectionLabels: {
    summary: 'Professional Summary',
    skills: 'Technical Expertise',
    experience: 'Professional Experience',
    projects: 'Featured Projects & Systems',
    education: 'Education & Certifications'
  },
  highlightKeywords: true,
  tailoredSummary: '',
  targetRole: '',
  selectedIds: {
    skills: new Set(),
    work_experience: new Set(),
    projects: new Set(),
    education: new Set(),
    certifications: new Set(),
    achievements: new Set(),
    publications: new Set()
  },
  selectedBullets: {
    work_experience: {},
    projects: {}
  },
  matchedKeywords: new Set(),

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Template switcher buttons
    document.querySelectorAll('.template-opt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.template-opt-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeTemplate = e.currentTarget.dataset.template;
        this.renderPreview();
      });
    });

    // Density toggle buttons (Compact 1-Page vs Detailed)
    document.querySelectorAll('.density-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.density-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.densityMode = e.currentTarget.dataset.density;
        this.applyDensityMode();
      });
    });

    // Emphasis toggle buttons (Technical vs Leadership vs Balanced)
    document.querySelectorAll('.emphasis-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.emphasis-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.setEmphasis(e.currentTarget.dataset.emphasis);
      });
    });

    // Keyword highlight toggle
    const toggleHl = document.getElementById('toggle-keyword-highlights');
    if (toggleHl) {
      toggleHl.addEventListener('change', (e) => {
        this.highlightKeywords = e.target.checked;
        this.renderPreview();
      });
    }

    // Role input change
    const roleInput = document.getElementById('jd-role-input');
    if (roleInput) {
      roleInput.addEventListener('input', (e) => {
        this.targetRole = e.target.value.trim();
        this.renderPreview();
      });
    }

    // Summary textarea change
    const summaryInput = document.getElementById('tailored-summary-input');
    if (summaryInput) {
      summaryInput.addEventListener('input', (e) => {
        this.tailoredSummary = e.target.value;
        this.renderPreview();
      });
    }

    // PDF Download
    const btnPdf = document.getElementById('btn-download-pdf');
    if (btnPdf) {
      btnPdf.addEventListener('click', () => {
        this.downloadPDF();
      });
    }

    // DOCX Download
    const btnDocx = document.getElementById('btn-download-docx');
    if (btnDocx) {
      btnDocx.addEventListener('click', () => {
        this.downloadDOCX();
      });
    }

    // Save Resume Snapshot
    const btnSave = document.getElementById('btn-save-resume-snapshot');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        this.saveCurrentSnapshot();
      });
    }
  },

  applyDensityMode(quiet = false) {
    const portfolio = Portfolio.data;
    if (!portfolio) return;

    if (this.densityMode === 'compact') {
      // 1-PAGE OPTIMAL: High impact, zero text clutter
      // 1. Select top 8-10 strictly relevant skills
      const featuredSkills = (portfolio.skills || []).filter(s => s.is_featured || s.proficiency === 'Expert');
      this.selectedIds.skills = new Set((featuredSkills.length > 0 ? featuredSkills : portfolio.skills).slice(0, 9).map(s => s.id));

      // 2. Select top 2 experiences with only top 2 punchiest metric bullets each
      const exps = (portfolio.work_experience || []).slice(0, 2);
      this.selectedIds.work_experience = new Set(exps.map(e => e.id));
      exps.forEach(exp => {
        // Pick only first 2 strongest metric bullets
        this.selectedBullets.work_experience[exp.id] = new Set([0, 1]);
      });

      // 3. Select top 2 projects with top 2 bullets each
      const projs = (portfolio.projects || []).slice(0, 2);
      this.selectedIds.projects = new Set(projs.map(p => p.id));
      projs.forEach(proj => {
        this.selectedBullets.projects[proj.id] = new Set([0, 1]);
      });

      // 4. Select top 1 degree and top 2 certs
      this.selectedIds.education = new Set((portfolio.education || []).slice(0, 1).map(ed => ed.id));
      this.selectedIds.certifications = new Set((portfolio.certifications || []).slice(0, 2).map(c => c.id));
      this.selectedIds.achievements = new Set((portfolio.achievements || []).slice(0, 1).map(a => a.id));

      // 5. Concise 2-sentence summary
      if (this.tailoredSummary.length > 220) {
        const sentences = this.tailoredSummary.match(/[^\.!\?]+[\.!\?]+/g);
        if (sentences && sentences.length >= 2) {
          this.tailoredSummary = sentences.slice(0, 2).join(' ').trim();
          const summaryInput = document.getElementById('tailored-summary-input');
          if (summaryInput) summaryInput.value = this.tailoredSummary;
        }
      }

      if (!quiet) App.showToast('Switched to 1-Page Compact mode (curated for 6-second recruiter scanning)', 'info');
    } else {
      // DETAILED (2-Page comprehensive)
      this.selectedIds.skills = new Set((portfolio.skills || []).slice(0, 18).map(s => s.id));
      this.selectedIds.work_experience = new Set((portfolio.work_experience || []).map(e => e.id));
      this.selectedIds.projects = new Set((portfolio.projects || []).map(p => p.id));
      this.selectedIds.education = new Set((portfolio.education || []).map(ed => ed.id));
      this.selectedIds.certifications = new Set((portfolio.certifications || []).map(c => c.id));
      this.selectedIds.achievements = new Set((portfolio.achievements || []).map(a => a.id));

      (portfolio.work_experience || []).forEach(exp => {
        this.selectedBullets.work_experience[exp.id] = new Set((exp.bullet_points || []).map((_, idx) => idx));
      });
      (portfolio.projects || []).forEach(proj => {
        this.selectedBullets.projects[proj.id] = new Set((proj.bullet_points || []).map((_, idx) => idx));
      });

      if (!quiet) App.showToast('Switched to Detailed mode (comprehensive multi-page format)', 'info');
    }

    this.renderSelectionMatrix();
    this.renderSectionOrderWidget();
    this.renderPreview();
  },

  renderSectionOrderWidget() {
    const container = document.getElementById('section-order-list');
    if (!container) return;

    let html = '';
    this.sectionOrder.forEach((secKey, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === this.sectionOrder.length - 1;
      const label = this.sectionLabels[secKey] || secKey;
      html += `
        <div class="section-order-item">
          <span>${idx + 1}. ${label}</span>
          <div class="section-order-btns">
            <button type="button" class="section-move-btn" onclick="ResumeBuilder.moveSection(${idx}, -1)" ${isFirst ? 'disabled' : ''} title="Move section up">▲</button>
            <button type="button" class="section-move-btn" onclick="ResumeBuilder.moveSection(${idx}, 1)" ${isLast ? 'disabled' : ''} title="Move section down">▼</button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  },

  moveSection(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.sectionOrder.length) return;
    const temp = this.sectionOrder[index];
    this.sectionOrder[index] = this.sectionOrder[targetIndex];
    this.sectionOrder[targetIndex] = temp;
    this.renderSectionOrderWidget();
    this.renderPreview();
    App.showToast(`Reordered "${this.sectionLabels[temp]}" to position ${targetIndex + 1}`, 'info');
  },

  setEmphasis(emphasis) {
    this.emphasis = emphasis;
    const portfolio = Portfolio.data;
    if (!portfolio) return;

    if (emphasis === 'technical') {
      const techSkills = (portfolio.skills || []).filter(s => 
        (s.category && (s.category.includes('Languages') || s.category.includes('Web') || s.category.includes('Storage'))) || s.proficiency === 'Expert'
      );
      this.selectedIds.skills = new Set((techSkills.length > 0 ? techSkills : portfolio.skills).slice(0, 9).map(s => s.id));
      App.showToast('Applied Technical Emphasis: Highlighting core programming stack & systems', 'info');
    } else if (emphasis === 'leadership') {
      const leadSkills = (portfolio.skills || []).filter(s => 
        (s.category && (s.category.includes('AI') || s.category.includes('Leadership'))) || s.is_featured
      );
      this.selectedIds.skills = new Set((leadSkills.length > 0 ? leadSkills : portfolio.skills).slice(0, 9).map(s => s.id));
      App.showToast('Applied Leadership Emphasis: Highlighting systems architecture & founder initiatives', 'info');
    } else {
      this.applyDensityMode(true);
      App.showToast('Applied Balanced Emphasis: Overview across all competencies', 'info');
    }

    this.renderSelectionMatrix();
    this.renderPreview();
  },

  initDefaultSelections(portfolio) {
    if (!portfolio) return;
    this.targetRole = portfolio.personal_info?.professional_title || 'Senior AI & Full-Stack Engineer';
    const roleInput = document.getElementById('jd-role-input');
    if (roleInput && !roleInput.value) {
      roleInput.value = this.targetRole;
    }

    this.tailoredSummary = portfolio.personal_info?.professional_summary || '';
    const summaryInput = document.getElementById('tailored-summary-input');
    if (summaryInput && !summaryInput.value) {
      summaryInput.value = this.tailoredSummary;
    }

    // Render section order widget and default to compact
    this.renderSectionOrderWidget();
    this.applyDensityMode(true);
  },

  applyJDMatchResult(matchData) {
    if (!matchData) return;

    if (matchData.job_title_detected) {
      this.targetRole = matchData.job_title_detected;
      const roleInput = document.getElementById('jd-role-input');
      if (roleInput) roleInput.value = this.targetRole;
    }

    if (matchData.tailored_professional_summary) {
      this.tailoredSummary = matchData.tailored_professional_summary;
      const summaryInput = document.getElementById('tailored-summary-input');
      if (summaryInput) summaryInput.value = this.tailoredSummary;
    }

    // Populate matched keywords for highlighting
    this.matchedKeywords = new Set();
    (matchData.matched_skills || []).forEach(m => this.matchedKeywords.add(m.skill.toLowerCase()));

    // Auto-select recommended projects & experiences (tight curated count)
    if (matchData.recommended_projects) {
      this.selectedIds.projects.clear();
      matchData.recommended_projects.slice(0, 2).forEach(rec => {
        this.selectedIds.projects.add(rec.id);
        if (!this.selectedBullets.projects[rec.id]) {
          this.selectedBullets.projects[rec.id] = new Set([0, 1]);
        }
      });
    }

    this.renderSelectionMatrix();
    this.renderPreview();
  },

  renderSelectionMatrix() {
    const container = document.getElementById('resume-customization-matrix');
    if (!container || !Portfolio.data) return;

    const data = Portfolio.data;
    let html = '';

    // 1. Work Experience selector
    html += `
      <div class="selection-section">
        <div class="selection-section-header">
          <span>Work Experience & Positions</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Curate top positions & bullets</span>
        </div>
    `;
    (data.work_experience || []).forEach(exp => {
      const isChecked = this.selectedIds.work_experience.has(exp.id);
      const activeBullets = this.selectedBullets.work_experience[exp.id] || new Set();
      
      html += `
        <div class="item-check-card ${isChecked ? 'checked' : ''}" id="card-exp-${exp.id}">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="ResumeBuilder.toggleItem('work_experience', ${exp.id}, this.checked)">
          <div class="item-check-info">
            <div class="item-check-title">
              <span>${exp.position}</span>
              <span class="item-relevance-badge">${exp.is_current ? 'Present' : exp.end_date}</span>
            </div>
            <div class="item-check-sub">${exp.company} • ${exp.location || ''}</div>
            
            ${isChecked ? `
              <div class="nested-bullets-list">
                ${(exp.bullet_points || []).map((bullet, idx) => `
                  <div class="bullet-check-row">
                    <input type="checkbox" ${activeBullets.has(idx) ? 'checked' : ''} onchange="ResumeBuilder.toggleBullet('work_experience', ${exp.id}, ${idx}, this.checked)">
                    <span>${bullet}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
    html += `</div>`;

    // 2. Projects selector
    html += `
      <div class="selection-section">
        <div class="selection-section-header">
          <span>Featured Projects</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Include relevant systems</span>
        </div>
    `;
    (data.projects || []).forEach(proj => {
      const isChecked = this.selectedIds.projects.has(proj.id);
      const activeBullets = this.selectedBullets.projects[proj.id] || new Set();

      html += `
        <div class="item-check-card ${isChecked ? 'checked' : ''}" id="card-proj-${proj.id}">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="ResumeBuilder.toggleItem('projects', ${proj.id}, this.checked)">
          <div class="item-check-info">
            <div class="item-check-title">
              <span>${proj.title}</span>
              ${proj.role ? `<span class="item-relevance-badge">${proj.role}</span>` : ''}
            </div>
            <div class="item-check-sub">${(proj.tech_stack || []).join(', ')}</div>
            ${isChecked ? `
              <div class="nested-bullets-list">
                ${(proj.bullet_points || []).map((b, idx) => `
                  <div class="bullet-check-row">
                    <input type="checkbox" ${activeBullets.has(idx) ? 'checked' : ''} onchange="ResumeBuilder.toggleBullet('projects', ${proj.id}, ${idx}, this.checked)">
                    <span>${b}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
    html += `</div>`;

    // 3. Technical Skills selector
    html += `
      <div class="selection-section">
        <div class="selection-section-header">
          <span>Technical Skills (${this.selectedIds.skills.size} selected)</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Keep to top 8–10 core skills</span>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; background: var(--bg-surface-elevated); padding: 0.65rem; border-radius: var(--radius-sm); border: 1px solid var(--border-hairline);">
    `;
    (data.skills || []).forEach(skill => {
      const isChecked = this.selectedIds.skills.has(skill.id);
      const isMatched = this.matchedKeywords.has(skill.name.toLowerCase());
      html += `
        <label style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; padding: 3px 8px; border-radius: var(--radius-xs); background: ${isChecked ? (isMatched ? 'var(--success-subtle)' : 'var(--bg-surface)') : 'transparent'}; border: 1px solid ${isChecked ? (isMatched ? 'var(--success-border)' : 'var(--text-muted)') : 'var(--border-hairline)'}; cursor: pointer;">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="ResumeBuilder.toggleItem('skills', ${skill.id}, this.checked)">
          <span style="${isMatched ? 'font-weight: 700; color: #34d399;' : ''}">${skill.name}</span>
        </label>
      `;
    });
    html += `</div></div>`;

    // 4. Certifications selector
    html += `
      <div class="selection-section">
        <div class="selection-section-header">
          <span>Certifications & Education</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
    `;
    (data.certifications || []).forEach(cert => {
      const isChecked = this.selectedIds.certifications.has(cert.id);
      html += `
        <label class="item-check-card ${isChecked ? 'checked' : ''}" style="margin-bottom: 0;">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="ResumeBuilder.toggleItem('certifications', ${cert.id}, this.checked)">
          <div class="item-check-info">
            <div style="font-size: 0.7875rem; font-weight: 600;">${cert.name}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${cert.issuing_organization}</div>
          </div>
        </label>
      `;
    });
    (data.education || []).forEach(edu => {
      const isChecked = this.selectedIds.education.has(edu.id);
      html += `
        <label class="item-check-card ${isChecked ? 'checked' : ''}" style="margin-bottom: 0;">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="ResumeBuilder.toggleItem('education', ${edu.id}, this.checked)">
          <div class="item-check-info">
            <div style="font-size: 0.7875rem; font-weight: 600;">${edu.degree}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${edu.institution}</div>
          </div>
        </label>
      `;
    });
    html += `</div></div>`;

    container.innerHTML = html;
  },

  toggleItem(category, itemId, checked) {
    if (checked) {
      this.selectedIds[category].add(itemId);
    } else {
      this.selectedIds[category].delete(itemId);
    }
    this.renderSelectionMatrix();
    this.renderPreview();
  },

  toggleBullet(category, itemId, bulletIdx, checked) {
    if (!this.selectedBullets[category][itemId]) {
      this.selectedBullets[category][itemId] = new Set();
    }
    if (checked) {
      this.selectedBullets[category][itemId].add(bulletIdx);
    } else {
      this.selectedBullets[category][itemId].delete(bulletIdx);
    }
    this.renderPreview();
  },

  getActiveResumeData() {
    const data = Portfolio.data;
    if (!data) return {};

    const activeSkills = (data.skills || []).filter(s => this.selectedIds.skills.has(s.id));
    const activeEdu = (data.education || []).filter(e => this.selectedIds.education.has(e.id));
    const activeCerts = (data.certifications || []).filter(c => this.selectedIds.certifications.has(c.id));
    const activeAch = (data.achievements || []).filter(a => this.selectedIds.achievements.has(a.id));

    // Filter experiences and only active checked bullets
    const activeExp = (data.work_experience || []).filter(e => this.selectedIds.work_experience.has(e.id)).map(e => {
      const bulletSet = this.selectedBullets.work_experience[e.id] || new Set();
      const filteredBullets = (e.bullet_points || []).filter((_, idx) => bulletSet.has(idx));
      return { ...e, bullet_points: filteredBullets };
    });

    // Filter projects and only active checked bullets
    const activeProj = (data.projects || []).filter(p => this.selectedIds.projects.has(p.id)).map(p => {
      const bulletSet = this.selectedBullets.projects[p.id] || new Set();
      const filteredBullets = (p.bullet_points || []).filter((_, idx) => bulletSet.has(idx));
      return { ...p, bullet_points: filteredBullets };
    });

    return {
      personal_info: data.personal_info || {},
      target_role: this.targetRole || data.personal_info?.professional_title || 'Senior Software Engineer',
      tailored_summary: this.tailoredSummary || data.personal_info?.professional_summary || '',
      density: this.densityMode,
      emphasis: this.emphasis,
      section_order: this.sectionOrder,
      skills: activeSkills,
      work_experience: activeExp,
      projects: activeProj,
      education: activeEdu,
      certifications: activeCerts,
      achievements: activeAch,
      languages: data.languages || []
    };
  },

  formatBullet(text) {
    if (!text) return '';
    let formatted = text;

    // Automatically bold metrics and quantitative figures (e.g. 58%, 42%, 2.4x, 1,200+, $120k)
    formatted = formatted.replace(/\b(\d+[\d,\.]*\s*(?:%|x|\+|k|M|ms|s|users|stars|events\/sec|metrics\/sec)?)\b/g, (match) => {
      // Avoid matching single standalone small numbers like 1, 2, 3 unless followed by metric symbol
      if (/^\d{1,2}$/.test(match)) return match;
      return `<strong class="res-metric">${match}</strong>`;
    });

    // Naturally highlight matched JD keywords if enabled
    if (this.highlightKeywords && this.matchedKeywords.size > 0) {
      this.matchedKeywords.forEach(kw => {
        const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
        formatted = formatted.replace(regex, '<span class="res-keyword-highlight">$1</span>');
      });
    }

    return formatted;
  },

  renderPreview() {
    const container = document.getElementById('live-resume-paper');
    if (!container) return;

    const resume = this.getActiveResumeData();
    const p = resume.personal_info || {};

    // Calculate word count for scannability metrics
    const fullText = JSON.stringify(resume);
    const wordCount = (fullText.match(/\b\w+\b/g) || []).length;
    const isOnePage = wordCount <= 420;

    // Update scannability bar
    const metricsBar = document.getElementById('resume-scan-metrics-bar');
    if (metricsBar) {
      metricsBar.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isOnePage ? 'var(--success)' : 'var(--warning)'};"></span>
          <span><strong>${isOnePage ? '1-Page Optimal' : 'Detailed Multi-Page'}</strong> (${wordCount} words)</span>
        </div>
        <div style="color: var(--text-muted); font-size: 0.725rem;">
          Recruiter Scan Time: <strong>${isOnePage ? '6–8 seconds' : '15+ seconds'}</strong>
        </div>
      `;
    }

    // Apply template class
    container.className = `resume-paper-wrapper ${this.activeTemplate}`;

    // Group skills by category for clean compact display
    const skillGroups = {};
    (resume.skills || []).forEach(s => {
      const cat = s.category || 'Core';
      if (!skillGroups[cat]) skillGroups[cat] = [];
      skillGroups[cat].push(s.name);
    });

    let headerHtml = `
      <!-- Header -->
      <div class="res-header">
        <h1 class="res-name">${p.full_name || 'Professional Name'}</h1>
        <div class="res-target-title">${resume.target_role}</div>
        <div class="res-contact-bar">
          ${p.email ? `<span class="res-contact-item">${p.email}</span>` : ''}
          ${p.phone ? `<span class="res-contact-item">• ${p.phone}</span>` : ''}
          ${p.location ? `<span class="res-contact-item">• ${p.location}</span>` : ''}
          ${p.linkedin_url ? `<span class="res-contact-item">• LinkedIn</span>` : ''}
          ${p.github_url ? `<span class="res-contact-item">• GitHub</span>` : ''}
          ${p.portfolio_url ? `<span class="res-contact-item">• Portfolio</span>` : ''}
        </div>
      </div>
    `;

    // Map section keys to their HTML generators
    const sectionRenderers = {
      summary: () => resume.tailored_summary ? `
        <div class="res-section">
          <div class="res-section-title">Professional Summary</div>
          <div class="res-summary-text">${this.formatBullet(resume.tailored_summary)}</div>
        </div>
      ` : '',

      skills: () => resume.skills.length > 0 ? `
        <div class="res-section">
          <div class="res-section-title">Technical Expertise</div>
          <div class="res-skills-compact">
            ${Object.entries(skillGroups).map(([cat, list]) => `
              <div class="res-skill-row">
                <span class="res-skill-label">${cat}:</span>
                <span class="res-skill-items">${this.formatBullet(list.join(', '))}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '',

      experience: () => resume.work_experience.length > 0 ? `
        <div class="res-section">
          <div class="res-section-title">Professional Experience</div>
          ${resume.work_experience.map(exp => `
            <div class="res-item">
              <div class="res-item-header">
                <div>
                  <span class="res-item-title">${exp.position}</span>
                  <span class="res-item-subtitle"> — ${exp.company}</span>
                </div>
                <span class="res-item-dates">${exp.start_date} – ${exp.is_current ? 'Present' : exp.end_date} ${exp.location ? `| ${exp.location}` : ''}</span>
              </div>
              <ul class="res-bullets-list">
                ${(exp.bullet_points || []).map(b => `<li>${this.formatBullet(b)}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      ` : '',

      projects: () => resume.projects.length > 0 ? `
        <div class="res-section">
          <div class="res-section-title">Featured Projects & Systems</div>
          ${resume.projects.map(proj => `
            <div class="res-item">
              <div class="res-item-header">
                <div>
                  <span class="res-item-title">${proj.title}</span>
                  ${proj.role ? `<span class="res-item-subtitle"> (${proj.role})</span>` : ''}
                </div>
                ${proj.start_date ? `<span class="res-item-dates">${proj.start_date} – ${proj.end_date || 'Present'}</span>` : ''}
              </div>
              ${proj.tech_stack && proj.tech_stack.length > 0 ? `
                <div style="font-size: 0.725rem; color: #52525b; margin-top: 1px;">
                  Stack: ${this.formatBullet(proj.tech_stack.join(', '))}
                </div>
              ` : ''}
              <ul class="res-bullets-list">
                ${(proj.bullet_points || []).map(b => `<li>${this.formatBullet(b)}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      ` : '',

      education: () => (resume.education.length > 0 || resume.certifications.length > 0) ? `
        <div class="res-section">
          <div class="res-section-title">Education & Certifications</div>
          <ul class="res-bullets-list">
            ${resume.education.map(edu => `
              <li>
                <strong>${edu.degree} in ${edu.field_of_study}</strong> — ${edu.institution} (${edu.start_date} – ${edu.end_date})
                ${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
              </li>
            `).join('')}
            ${resume.certifications.map(c => `
              <li><strong>${c.name}</strong> — ${c.issuing_organization} (${c.issue_date})</li>
            `).join('')}
          </ul>
        </div>
      ` : ''
    };

    // Concatenate sections in user's configured dynamic order
    let bodyHtml = '';
    this.sectionOrder.forEach(secKey => {
      if (sectionRenderers[secKey]) {
        bodyHtml += sectionRenderers[secKey]();
      }
    });

    container.innerHTML = headerHtml + bodyHtml;
  },

  downloadPDF() {
    App.showToast('Preparing PDF layout for print/export...', 'info');
    window.print();
  },

  async downloadDOCX() {
    try {
      App.showToast('Generating Microsoft Word (.docx) resume...', 'info');
      const resumeData = this.getActiveResumeData();
      await API.downloadDocx(resumeData);
      App.showToast('Word document downloaded successfully!', 'success');
    } catch (err) {
      App.showToast(`DOCX download failed: ${err.message}`, 'error');
    }
  },

  async saveCurrentSnapshot() {
    try {
      const resumeData = this.getActiveResumeData();
      const payload = {
        job_title: this.targetRole,
        target_company: JDMatcher.lastMatchResult?.company_detected || 'Target Company',
        job_description: document.getElementById('jd-textarea')?.value || '',
        match_score: JDMatcher.lastMatchResult?.match_score || 85,
        tailored_summary: this.tailoredSummary,
        selected_data: {
          selected_skills: Array.from(this.selectedIds.skills),
          selected_work_experience: Array.from(this.selectedIds.work_experience),
          selected_projects: Array.from(this.selectedIds.projects),
          selected_education: Array.from(this.selectedIds.education),
          selected_certifications: Array.from(this.selectedIds.certifications)
        },
        template_name: this.activeTemplate
      };

      await API.saveResume(payload);
      App.showToast('Resume snapshot saved to history database!', 'success');
      await App.refreshHistory();
    } catch (err) {
      App.showToast(`Failed to save resume: ${err.message}`, 'error');
    }
  }
};
