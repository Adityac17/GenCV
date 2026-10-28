/**
 * Google Sheets Synchronization Module
 * Manages webhook triggers, Apps Script code modal, CSV bundle downloads,
 * and live synchronization status.
 */

const SheetsSync = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    const btnSync = document.getElementById('btn-trigger-sheets-sync');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        await this.triggerSync();
      });
    }

    const btnViewScript = document.getElementById('btn-view-apps-script');
    if (btnViewScript) {
      btnViewScript.addEventListener('click', async () => {
        await this.openAppsScriptModal();
      });
    }

    const btnDownloadCsv = document.getElementById('btn-download-csv-bundle');
    if (btnDownloadCsv) {
      btnDownloadCsv.addEventListener('click', async () => {
        await this.downloadCsvBundle();
      });
    }

    const btnCopyScript = document.getElementById('btn-copy-script-code');
    if (btnCopyScript) {
      btnCopyScript.addEventListener('click', () => {
        this.copyScriptCode();
      });
    }
  },

  updateSyncStatus(settings) {
    if (!settings) return;
    const webhookInput = document.getElementById('sheets-webhook-url-input');
    const lastSyncEl = document.getElementById('sheets-last-sync-time');
    const sheetLinkEl = document.getElementById('sheets-live-url-link');

    if (webhookInput && settings.google_sheets_webhook_url) {
      webhookInput.value = settings.google_sheets_webhook_url;
    }

    if (lastSyncEl) {
      lastSyncEl.textContent = settings.last_sheets_sync || 'Never synchronized';
    }

    if (sheetLinkEl && settings.google_sheet_url) {
      sheetLinkEl.href = settings.google_sheet_url;
      sheetLinkEl.style.display = 'inline-flex';
      sheetLinkEl.textContent = 'Open Linked Google Sheet ↗';
    }
  },

  async triggerSync() {
    const urlInput = document.getElementById('sheets-webhook-url-input');
    const webhookUrl = urlInput ? urlInput.value.trim() : '';

    if (!webhookUrl) {
      App.showToast('Please provide your Google Apps Script Web App URL first', 'error');
      if (urlInput) urlInput.focus();
      return;
    }

    const btn = document.getElementById('btn-trigger-sheets-sync');
    btn.disabled = true;
    btn.innerHTML = `<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg> Synchronizing...`;

    try {
      App.showToast('Dispatching 9 database tables to Google Sheets...', 'info');
      const res = await API.syncGoogleSheets(webhookUrl);
      App.showToast('Google Sheet synchronized successfully!', 'success');
      
      const lastSyncEl = document.getElementById('sheets-last-sync-time');
      if (lastSyncEl) lastSyncEl.textContent = new Date().toLocaleString();

      if (res.data?.sheet_url) {
        const sheetLinkEl = document.getElementById('sheets-live-url-link');
        if (sheetLinkEl) {
          sheetLinkEl.href = res.data.sheet_url;
          sheetLinkEl.style.display = 'inline-flex';
        }
      }
      await App.refreshPortfolio();
    } catch (err) {
      App.showToast(`Sync failed: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        Synchronize Database Now
      `;
    }
  },

  async openAppsScriptModal() {
    try {
      const res = await API.getAppsScriptCode();
      const codeBlock = document.getElementById('apps-script-code-display');
      if (codeBlock) {
        codeBlock.textContent = res.code;
      }
      App.openModal('apps-script-modal');
    } catch (err) {
      App.showToast(`Failed to load template: ${err.message}`, 'error');
    }
  },

  copyScriptCode() {
    const codeBlock = document.getElementById('apps-script-code-display');
    if (!codeBlock) return;
    navigator.clipboard.writeText(codeBlock.textContent).then(() => {
      App.showToast('Google Apps Script copied to clipboard!', 'success');
    }).catch(err => {
      App.showToast('Could not copy code automatically', 'error');
    });
  },

  async downloadCsvBundle() {
    try {
      App.showToast('Generating CSV files for all 9 categories...', 'info');
      const res = await API.getCsvBundle();
      const bundle = res.data;

      // Download combined bundle or individual tabs
      for (const [tabName, csvContent] of Object.entries(bundle)) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `GenCV_${tabName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      App.showToast('Exported CSV files for all portfolio tabs!', 'success');
    } catch (err) {
      App.showToast(`CSV Export failed: ${err.message}`, 'error');
    }
  }
};
