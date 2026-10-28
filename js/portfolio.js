/**
 * Portfolio Management Module
 * Handles category switching, CRUD modals, personal info updates,
 * and AI unstructured text parsing.
 */

const Portfolio = {
  activeCategory: 'personal',
  data: {},

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Category tabs navigation
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeCategory = e.currentTarget.dataset.category;
        this.renderCategoryView();
      });
    });

    // Personal info form save
    const personalForm = document.getElementById('personal-info-form');
    if (personalForm) {
      personalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.savePersonalInfo();
      });
    }

    // Modal forms
    const itemForm = document.getElementById('portfolio-item-form');
    if (itemForm) {
      itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleItemFormSubmit();
      });
    }

    // AI Parser form
    const parserForm = document.getElementById('ai-parser-form');
    if (parserForm) {
      parserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleUnstructuredParse();
      });
    }
  },

  setData(portfolioData) {
    this.data = portfolioData;
    this.renderCategoryView();
    this.renderStats();
  },

  renderStats() {
    if (!this.data) return;
    const skillsCount = (this.data.skills || []).length;
    const expCount = (this.data.work_experience || []).length;
    const projCount = (this.data.projects || []).length;
    const certCount = (this.data.certifications || []).length;

    const elSkills = document.getElementById('stat-skills-count');
    const elExp = document.getElementById('stat-exp-count');
    const elProj = document.getElementById('stat-proj-count');
    const elCerts = document.getElementById('stat-certs-count');

    if (elSkills) elSkills.textContent = skillsCount;
    if (elExp) elExp.textContent = expCount;
    if (elProj) elProj.textContent = projCount;
    if (elCerts) elCerts.textContent = certCount;
  },

  renderCategoryView() {
    const container = document.getElementById('portfolio-content-area');
    if (!container) return;

    if (this.activeCategory === 'personal') {
      this.renderPersonalInfoForm(container);
      return;
    }

    const items = this.data[this.activeCategory] || [];
    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 700;">${this.formatCategoryTitle(this.activeCategory)}</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">${items.length} records in database</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="Portfolio.openAddModal('${this.activeCategory}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add New Entry
        </button>
      </div>
    `;

    if (items.length === 0) {
      html += `
        <div style="text-align: center; padding: 3rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <p style="color: var(--text-muted); margin-bottom: 1rem;">No entries found in this category.</p>
          <button class="btn btn-secondary btn-sm" onclick="Portfolio.openAddModal('${this.activeCategory}')">Add First Item</button>
        </div>
      `;
    } else {
      html += `<div class="portfolio-items-grid">`;
      items.forEach(item => {
        html += this.renderItemCard(this.activeCategory, item);
      });
      html += `</div>`;
    }

    container.innerHTML = html;
  },

  renderPersonalInfoForm(container) {
    const p = this.data.personal_info || {};
    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; max-width: 900px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 700;">Personal & Contact Profile</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">Core contact data displayed on your professional resumes</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="Portfolio.openAIParserModal()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            Import via Gemini AI
          </button>
        </div>

        <form id="personal-info-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" class="form-control" name="full_name" value="${p.full_name || ''}" required placeholder="e.g. Aditya Sunil Chouksey">
            </div>
            <div class="form-group">
              <label class="form-label">Professional Title *</label>
              <input type="text" class="form-control" name="professional_title" value="${p.professional_title || ''}" required placeholder="e.g. AI Automation Engineer & Full-Stack Developer">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" class="form-control" name="email" value="${p.email || ''}" required placeholder="name@domain.com">
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="text" class="form-control" name="phone" value="${p.phone || ''}" placeholder="+1 (555) 000-0000">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location (City, State / Remote)</label>
              <input type="text" class="form-control" name="location" value="${p.location || ''}" placeholder="San Francisco, CA">
            </div>
            <div class="form-group">
              <label class="form-label">LinkedIn URL</label>
              <input type="url" class="form-control" name="linkedin_url" value="${p.linkedin_url || ''}" placeholder="https://linkedin.com/in/username">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">GitHub URL</label>
              <input type="url" class="form-control" name="github_url" value="${p.github_url || ''}" placeholder="https://github.com/username">
            </div>
            <div class="form-group">
              <label class="form-label">Personal Portfolio / Website</label>
              <input type="url" class="form-control" name="portfolio_url" value="${p.portfolio_url || ''}" placeholder="https://portfolio.dev">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Career Objective</label>
            <textarea class="form-control" name="career_objective" rows="2" placeholder="Brief statement describing your professional mission and trajectory">${p.career_objective || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Executive Professional Summary</label>
            <textarea class="form-control" name="professional_summary" rows="3" placeholder="High-impact summary highlighting years of experience, core tech stack, and achievements">${p.professional_summary || ''}</textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Save Personal Information
            </button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('personal-info-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.savePersonalInfo();
    });
  },

  async savePersonalInfo() {
    const form = document.getElementById('personal-info-form');
    const formData = new FormData(form);
    const payload = {};
    formData.forEach((val, key) => { payload[key] = val; });

    try {
      App.showToast('Saving personal details...', 'info');
      await API.updatePersonalInfo(payload);
      App.showToast('Personal info updated successfully!', 'success');
      await App.refreshPortfolio();
    } catch (err) {
      App.showToast(`Error: ${err.message}`, 'error');
    }
  },

  renderItemCard(category, item) {
    if (category === 'skills') {
      return `
        <div class="portfolio-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h4 class="card-title">${item.name}</h4>
              <span class="tag-badge">${item.category}</span>
            </div>
            <div class="card-meta">
              <span>Proficiency: <strong>${item.proficiency}</strong></span>
              <span>•</span>
              <span>${item.years_of_experience || 1} yrs exp</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm" onclick="Portfolio.openEditModal('skills', ${item.id})">Edit</button>
            <button class="btn btn-danger-outline btn-sm" onclick="Portfolio.deleteItem('skills', ${item.id})">Delete</button>
          </div>
        </div>
      `;
    }

    if (category === 'work_experience') {
      const bullets = (item.bullet_points || []).map(b => `<li>${b}</li>`).join('');
      const tags = (item.technologies || []).map(t => `<span class="tag-badge">${t}</span>`).join('');
      return `
        <div class="portfolio-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h4 class="card-title">${item.position}</h4>
                <div class="card-subtitle">${item.company}</div>
              </div>
              <span class="tag-badge">${item.is_current ? 'Present' : item.end_date}</span>
            </div>
            <div class="card-meta">
              <span>${item.start_date} – ${item.is_current ? 'Present' : item.end_date}</span>
              ${item.location ? `<span>• ${item.location}</span>` : ''}
              <span>• ${item.employment_type || 'Full-time'}</span>
            </div>
            ${item.description ? `<p class="card-desc">${item.description}</p>` : ''}
            <ul style="padding-left: 1.1rem; font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
              ${bullets}
            </ul>
            <div class="card-tags">${tags}</div>
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm" onclick="Portfolio.openEditModal('work_experience', ${item.id})">Edit</button>
            <button class="btn btn-danger-outline btn-sm" onclick="Portfolio.deleteItem('work_experience', ${item.id})">Delete</button>
          </div>
        </div>
      `;
    }

    if (category === 'projects') {
      const bullets = (item.bullet_points || []).map(b => `<li>${b}</li>`).join('');
      const tags = (item.tech_stack || []).map(t => `<span class="tag-badge">${t}</span>`).join('');
      return `
        <div class="portfolio-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h4 class="card-title">${item.title}</h4>
              ${item.role ? `<span class="tag-badge">${item.role}</span>` : ''}
            </div>
            <p class="card-desc">${item.description || ''}</p>
            ${item.impact_metrics ? `<div style="font-size: 0.8rem; font-weight: 600; color: var(--success); margin-bottom: 0.5rem;">Impact: ${item.impact_metrics}</div>` : ''}
            <ul style="padding-left: 1.1rem; font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
              ${bullets}
            </ul>
            <div class="card-tags">${tags}</div>
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm" onclick="Portfolio.openEditModal('projects', ${item.id})">Edit</button>
            <button class="btn btn-danger-outline btn-sm" onclick="Portfolio.deleteItem('projects', ${item.id})">Delete</button>
          </div>
        </div>
      `;
    }

    if (category === 'education') {
      return `
        <div class="portfolio-card">
          <div>
            <h4 class="card-title">${item.degree} in ${item.field_of_study}</h4>
            <div class="card-subtitle">${item.institution}</div>
            <div class="card-meta">
              <span>${item.start_date} – ${item.end_date}</span>
              ${item.location ? `<span>• ${item.location}</span>` : ''}
              ${item.gpa ? `<span>• GPA: ${item.gpa}</span>` : ''}
            </div>
            ${item.highlights ? `<p class="card-desc" style="font-size: 0.8rem;">${item.highlights}</p>` : ''}
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm" onclick="Portfolio.openEditModal('education', ${item.id})">Edit</button>
            <button class="btn btn-danger-outline btn-sm" onclick="Portfolio.deleteItem('education', ${item.id})">Delete</button>
          </div>
        </div>
      `;
    }

    if (category === 'certifications') {
      return `
        <div class="portfolio-card">
          <div>
            <h4 class="card-title">${item.name}</h4>
            <div class="card-subtitle">${item.issuing_organization}</div>
            <div class="card-meta">
              <span>Issued: ${item.issue_date}</span>
              ${item.expiration_date ? `<span>• Expires: ${item.expiration_date}</span>` : '<span>• No Expiration</span>'}
            </div>
            ${item.credential_id ? `<div style="font-size: 0.75rem; color: var(--text-muted);">Credential ID: ${item.credential_id}</div>` : ''}
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm" onclick="Portfolio.openEditModal('certifications', ${item.id})">Edit</button>
            <button class="btn btn-danger-outline btn-sm" onclick="Portfolio.deleteItem('certifications', ${item.id})">Delete</button>
          </div>
        </div>
      `;
    }

    if (category === 'achievements') {
      return `
        <div class="portfolio-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h4 class="card-title">${item.title}</h4>
              <span class="tag-badge">${item.category || 'Award'}</span>
            </div>
            <div class="card-subtitle">${item.issuer || ''}</div>
            <div class="card-meta"><span>${item.date || ''}</span></div>
            <p class="card-desc">${item.description || ''}</p>
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm" onclick="Portfolio.openEditModal('achievements', ${item.id})">Edit</button>
            <button class="btn btn-danger-outline btn-sm" onclick="Portfolio.deleteItem('achievements', ${item.id})">Delete</button>
          </div>
        </div>
      `;
    }

    if (category === 'publications') {
      return `
        <div class="portfolio-card">
          <div>
            <h4 class="card-title">${item.title}</h4>
            <div class="card-subtitle">${item.publisher_or_conference}</div>
            <div class="card-meta">
              <span>Published: ${item.publication_date}</span>
              ${item.co_authors ? `<span>• Authors: ${item.co_authors}</span>` : ''}
            </div>
            ${item.abstract_snippet ? `<p class="card-desc" style="font-size: 0.8rem;">${item.abstract_snippet}</p>` : ''}
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm" onclick="Portfolio.openEditModal('publications', ${item.id})">Edit</button>
            <button class="btn btn-danger-outline btn-sm" onclick="Portfolio.deleteItem('publications', ${item.id})">Delete</button>
          </div>
        </div>
      `;
    }

    if (category === 'languages') {
      return `
        <div class="portfolio-card">
          <div>
            <h4 class="card-title">${item.language}</h4>
            <div class="card-meta"><span>Proficiency: <strong>${item.proficiency}</strong></span></div>
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm" onclick="Portfolio.openEditModal('languages', ${item.id})">Edit</button>
            <button class="btn btn-danger-outline btn-sm" onclick="Portfolio.deleteItem('languages', ${item.id})">Delete</button>
          </div>
        </div>
      `;
    }

    return '';
  },

  formatCategoryTitle(cat) {
    const map = {
      'personal': 'Personal Information',
      'skills': 'Technical & Soft Skills',
      'work_experience': 'Professional Work Experience & Internships',
      'projects': 'Featured Projects & Open-Source Systems',
      'education': 'Education & Academic Qualifications',
      'certifications': 'Certifications & Online Courses',
      'achievements': 'Honors, Awards & Achievements',
      'publications': 'Research Papers & Publications',
      'languages': 'Languages & Fluency'
    };
    return map[cat] || cat.replace('_', ' ').toUpperCase();
  },

  openAddModal(category) {
    this.renderModalForm(category, null);
    App.openModal('portfolio-item-modal');
  },

  openEditModal(category, itemId) {
    const items = this.data[category] || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    this.renderModalForm(category, item);
    App.openModal('portfolio-item-modal');
  },

  renderModalForm(category, item) {
    const isEdit = !!item;
    document.getElementById('item-modal-title').textContent = `${isEdit ? 'Edit' : 'Add New'} ${category.replace('_', ' ').slice(0, -1)}`;
    document.getElementById('item-modal-category').value = category;
    document.getElementById('item-modal-id').value = isEdit ? item.id : '';

    const body = document.getElementById('item-modal-body');
    let html = '';

    if (category === 'skills') {
      html = `
        <div class="form-group">
          <label class="form-label">Skill Name *</label>
          <input type="text" class="form-control" name="name" required value="${item?.name || ''}" placeholder="e.g. Python, Docker, PyTorch">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-control" name="category">
              ${['Programming Languages', 'Web & Frameworks', 'AI & Machine Learning', 'Cloud & Infrastructure', 'Databases & Storage', 'Soft Skills & Leadership'].map(c => `
                <option value="${c}" ${item?.category === c ? 'selected' : ''}>${c}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Proficiency</label>
            <select class="form-control" name="proficiency">
              ${['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(p => `
                <option value="${p}" ${item?.proficiency === p ? 'selected' : ''}>${p}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Years of Experience</label>
            <input type="number" step="0.5" class="form-control" name="years_of_experience" value="${item?.years_of_experience || 2}">
          </div>
          <div class="form-group" style="display: flex; align-items: center; margin-top: 1.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" name="is_featured" value="1" ${item?.is_featured ? 'checked' : ''}>
              Feature on core summary
            </label>
          </div>
        </div>
      `;
    } else if (category === 'work_experience') {
      html = `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Company / Organization *</label>
            <input type="text" class="form-control" name="company" required value="${item?.company || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Position / Role *</label>
            <input type="text" class="form-control" name="position" required value="${item?.position || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Employment Type</label>
            <select class="form-control" name="employment_type">
              ${['Full-time', 'Internship', 'Contract', 'Freelance'].map(t => `
                <option value="${t}" ${item?.employment_type === t ? 'selected' : ''}>${t}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-control" name="location" value="${item?.location || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="text" class="form-control" name="start_date" value="${item?.start_date || ''}" placeholder="YYYY-MM">
          </div>
          <div class="form-group">
            <label class="form-label">End Date (or leave empty if current)</label>
            <input type="text" class="form-control" name="end_date" value="${item?.end_date || ''}" placeholder="YYYY-MM or Present">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Technologies Used (comma-separated)</label>
          <input type="text" class="form-control" name="technologies" value="${(item?.technologies || []).join(', ')}" placeholder="FastAPI, React, Docker">
        </div>
        <div class="form-group">
          <label class="form-label">Bullet Points (one accomplishment per line with metrics)</label>
          <textarea class="form-control" name="bullet_points" rows="4" placeholder="• Architected microservices reducing latency by 40%...">${(item?.bullet_points || []).join('\n')}</textarea>
        </div>
      `;
    } else if (category === 'projects') {
      html = `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Project Title *</label>
            <input type="text" class="form-control" name="title" required value="${item?.title || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Your Role</label>
            <input type="text" class="form-control" name="role" value="${item?.role || ''}" placeholder="Lead Developer">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">GitHub URL</label>
            <input type="url" class="form-control" name="github_url" value="${item?.github_url || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Live Demo URL</label>
            <input type="url" class="form-control" name="live_url" value="${item?.live_url || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tech Stack (comma-separated)</label>
          <input type="text" class="form-control" name="tech_stack" value="${(item?.tech_stack || []).join(', ')}" placeholder="Python, Gemini API, Next.js">
        </div>
        <div class="form-group">
          <label class="form-label">Key Impact Metrics</label>
          <input type="text" class="form-control" name="impact_metrics" value="${item?.impact_metrics || ''}" placeholder="e.g. 10k monthly active users, 35% speedup">
        </div>
        <div class="form-group">
          <label class="form-label">Bullet Points (one per line)</label>
          <textarea class="form-control" name="bullet_points" rows="3">${(item?.bullet_points || []).join('\n')}</textarea>
        </div>
      `;
    } else if (category === 'education') {
      html = `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Institution *</label>
            <input type="text" class="form-control" name="institution" required value="${item?.institution || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Degree *</label>
            <input type="text" class="form-control" name="degree" required value="${item?.degree || ''}" placeholder="Bachelor of Science">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Field of Study</label>
            <input type="text" class="form-control" name="field_of_study" value="${item?.field_of_study || ''}" placeholder="Computer Science">
          </div>
          <div class="form-group">
            <label class="form-label">GPA</label>
            <input type="text" class="form-control" name="gpa" value="${item?.gpa || ''}" placeholder="3.9 / 4.0">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="text" class="form-control" name="start_date" value="${item?.start_date || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">End Date</label>
            <input type="text" class="form-control" name="end_date" value="${item?.end_date || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Honors & Highlights</label>
          <textarea class="form-control" name="highlights" rows="2">${item?.highlights || ''}</textarea>
        </div>
      `;
    } else if (category === 'certifications') {
      html = `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Certification Name *</label>
            <input type="text" class="form-control" name="name" required value="${item?.name || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Issuing Organization *</label>
            <input type="text" class="form-control" name="issuing_organization" required value="${item?.issuing_organization || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Issue Date</label>
            <input type="text" class="form-control" name="issue_date" value="${item?.issue_date || ''}" placeholder="YYYY-MM">
          </div>
          <div class="form-group">
            <label class="form-label">Expiration Date (Optional)</label>
            <input type="text" class="form-control" name="expiration_date" value="${item?.expiration_date || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Credential Verification URL</label>
          <input type="url" class="form-control" name="credential_url" value="${item?.credential_url || ''}">
        </div>
      `;
    } else if (category === 'achievements') {
      html = `
        <div class="form-group">
          <label class="form-label">Award / Achievement Title *</label>
          <input type="text" class="form-control" name="title" required value="${item?.title || ''}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Issuer</label>
            <input type="text" class="form-control" name="issuer" value="${item?.issuer || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="text" class="form-control" name="date" value="${item?.date || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-control" name="description" rows="2">${item?.description || ''}</textarea>
        </div>
      `;
    } else if (category === 'publications') {
      html = `
        <div class="form-group">
          <label class="form-label">Paper / Publication Title *</label>
          <input type="text" class="form-control" name="title" required value="${item?.title || ''}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Publisher or Conference</label>
            <input type="text" class="form-control" name="publisher_or_conference" value="${item?.publisher_or_conference || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="text" class="form-control" name="publication_date" value="${item?.publication_date || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Co-Authors</label>
          <input type="text" class="form-control" name="co_authors" value="${item?.co_authors || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Abstract Snippet</label>
          <textarea class="form-control" name="abstract_snippet" rows="2">${item?.abstract_snippet || ''}</textarea>
        </div>
      `;
    } else if (category === 'languages') {
      html = `
        <div class="form-group">
          <label class="form-label">Language *</label>
          <input type="text" class="form-control" name="language" required value="${item?.language || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Proficiency</label>
          <select class="form-control" name="proficiency">
            ${['Native / Bilingual', 'Fluent', 'Professional Working', 'Conversational', 'Elementary'].map(p => `
              <option value="${p}" ${item?.proficiency === p ? 'selected' : ''}>${p}</option>
            `).join('')}
          </select>
        </div>
      `;
    }

    body.innerHTML = html;
  },

  async handleItemFormSubmit() {
    const form = document.getElementById('portfolio-item-form');
    const category = document.getElementById('item-modal-category').value;
    const itemId = document.getElementById('item-modal-id').value;

    const formData = new FormData(form);
    const payload = {};
    formData.forEach((val, key) => {
      if (['bullet_points'].includes(key)) {
        payload[key] = val.split('\n').map(s => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
      } else if (['technologies', 'tech_stack'].includes(key)) {
        payload[key] = val.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        payload[key] = val;
      }
    });

    try {
      if (itemId) {
        await API.updatePortfolioItem(category, itemId, payload);
        App.showToast('Item updated successfully', 'success');
      } else {
        await API.addPortfolioItem(category, payload);
        App.showToast('New item added to database', 'success');
      }
      App.closeModal('portfolio-item-modal');
      await App.refreshPortfolio();
    } catch (err) {
      App.showToast(`Error: ${err.message}`, 'error');
    }
  },

  async deleteItem(category, itemId) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await API.deletePortfolioItem(category, itemId);
      App.showToast('Item deleted successfully', 'success');
      await App.refreshPortfolio();
    } catch (err) {
      App.showToast(`Error: ${err.message}`, 'error');
    }
  },

  openAIParserModal() {
    App.openModal('ai-parser-modal');
  },

  async handleUnstructuredParse() {
    const rawText = document.getElementById('unstructured-text-input').value.trim();
    if (!rawText) {
      App.showToast('Please paste resume text or bio', 'error');
      return;
    }

    const btn = document.getElementById('btn-run-ai-parse');
    btn.disabled = true;
    btn.textContent = 'Analyzing with Gemini...';

    try {
      App.showToast('Gemini is structuring your information...', 'info');
      const res = await API.parseUnstructured(rawText, App.apiKey);
      const parsed = res.data;

      // Update personal info
      if (parsed.personal_info) {
        await API.updatePersonalInfo(parsed.personal_info);
      }

      // Add parsed skills
      for (const skill of (parsed.skills || [])) {
        await API.addPortfolioItem('skills', skill);
      }

      // Add parsed work experience
      for (const exp of (parsed.work_experience || [])) {
        await API.addPortfolioItem('work_experience', exp);
      }

      // Add parsed projects
      for (const proj of (parsed.projects || [])) {
        await API.addPortfolioItem('projects', proj);
      }

      // Add education
      for (const edu of (parsed.education || [])) {
        await API.addPortfolioItem('education', edu);
      }

      // Add certs
      for (const cert of (parsed.certifications || [])) {
        await API.addPortfolioItem('certifications', cert);
      }

      App.showToast('Portfolio successfully populated by Gemini!', 'success');
      App.closeModal('ai-parser-modal');
      await App.refreshPortfolio();
    } catch (err) {
      App.showToast(`AI Parsing error: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Parse & Import with Gemini';
    }
  }
};
