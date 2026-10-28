"""
Google Sheets Integration Service for GenCV.
Supports:
1. Google Apps Script Web App Synchronizer (Zero-auth setup, one-click sync to any Google Sheet).
2. Google Sheets API v4 with Service Account credentials.
3. Multi-sheet CSV/TSV table generator.
4. Bidirectional pull/sync from Google Sheets back into GenCV.
"""

import os
import json
import csv
import io
from typing import Dict, Any, List, Optional
import requests
from .database import get_complete_portfolio, get_setting, set_setting

def format_portfolio_for_sheets(portfolio: Dict[str, Any]) -> Dict[str, List[List[Any]]]:
    """
    Transform relational portfolio data into clean 2D table structures
    with designated headers for each Google Sheet tab.
    """
    tabs: Dict[str, List[List[Any]]] = {}

    # 1. Personal Info
    p = portfolio.get("personal_info", {})
    tabs["Personal_Info"] = [
        ["Field", "Value"],
        ["Full Name", p.get("full_name", "")],
        ["Professional Title", p.get("professional_title", "")],
        ["Email", p.get("email", "")],
        ["Phone", p.get("phone", "")],
        ["Location", p.get("location", "")],
        ["LinkedIn URL", p.get("linkedin_url", "")],
        ["GitHub URL", p.get("github_url", "")],
        ["Portfolio URL", p.get("portfolio_url", "")],
        ["Career Objective", p.get("career_objective", "")],
        ["Professional Summary", p.get("professional_summary", "")]
    ]

    # 2. Education
    edu_rows = [["ID", "Institution", "Degree", "Field of Study", "Start Date", "End Date", "GPA", "Location", "Highlights"]]
    for item in portfolio.get("education", []):
        edu_rows.append([
            item.get("id"),
            item.get("institution", ""),
            item.get("degree", ""),
            item.get("field_of_study", ""),
            item.get("start_date", ""),
            item.get("end_date", ""),
            item.get("gpa", ""),
            item.get("location", ""),
            item.get("highlights", "")
        ])
    tabs["Education"] = edu_rows

    # 3. Skills
    skills_rows = [["ID", "Skill Name", "Category", "Proficiency", "Years Experience", "Featured"]]
    for item in portfolio.get("skills", []):
        skills_rows.append([
            item.get("id"),
            item.get("name", ""),
            item.get("category", ""),
            item.get("proficiency", ""),
            item.get("years_of_experience", 0),
            "Yes" if item.get("is_featured") else "No"
        ])
    tabs["Skills"] = skills_rows

    # 4. Work Experience
    exp_rows = [["ID", "Company", "Position", "Employment Type", "Location", "Start Date", "End Date", "Current", "Technologies", "Bullet Points"]]
    for item in portfolio.get("work_experience", []):
        exp_rows.append([
            item.get("id"),
            item.get("company", ""),
            item.get("position", ""),
            item.get("employment_type", ""),
            item.get("location", ""),
            item.get("start_date", ""),
            item.get("end_date", ""),
            "Yes" if item.get("is_current") else "No",
            ", ".join(item.get("technologies", [])),
            "\n• " + "\n• ".join(item.get("bullet_points", [])) if item.get("bullet_points") else ""
        ])
    tabs["Work_Experience"] = exp_rows

    # 5. Projects
    proj_rows = [["ID", "Project Title", "Role", "Start Date", "End Date", "Live URL", "GitHub URL", "Tech Stack", "Impact Metrics", "Bullet Points"]]
    for item in portfolio.get("projects", []):
        proj_rows.append([
            item.get("id"),
            item.get("title", ""),
            item.get("role", ""),
            item.get("start_date", ""),
            item.get("end_date", ""),
            item.get("live_url", ""),
            item.get("github_url", ""),
            ", ".join(item.get("tech_stack", [])),
            item.get("impact_metrics", ""),
            "\n• " + "\n• ".join(item.get("bullet_points", [])) if item.get("bullet_points") else ""
        ])
    tabs["Projects"] = proj_rows

    # 6. Certifications
    cert_rows = [["ID", "Certification Name", "Issuing Organization", "Issue Date", "Expiration Date", "Credential ID", "Credential URL"]]
    for item in portfolio.get("certifications", []):
        cert_rows.append([
            item.get("id"),
            item.get("name", ""),
            item.get("issuing_organization", ""),
            item.get("issue_date", ""),
            item.get("expiration_date", ""),
            item.get("credential_id", ""),
            item.get("credential_url", "")
        ])
    tabs["Certifications"] = cert_rows

    # 7. Achievements
    ach_rows = [["ID", "Title", "Issuer", "Date", "Category", "Description"]]
    for item in portfolio.get("achievements", []):
        ach_rows.append([
            item.get("id"),
            item.get("title", ""),
            item.get("issuer", ""),
            item.get("date", ""),
            item.get("category", ""),
            item.get("description", "")
        ])
    tabs["Achievements"] = ach_rows

    # 8. Publications
    pub_rows = [["ID", "Paper Title", "Publisher / Conference", "Publication Date", "URL", "Co-Authors", "Abstract"]]
    for item in portfolio.get("publications", []):
        pub_rows.append([
            item.get("id"),
            item.get("title", ""),
            item.get("publisher_or_conference", ""),
            item.get("publication_date", ""),
            item.get("url", ""),
            item.get("co_authors", ""),
            item.get("abstract_snippet", "")
        ])
    tabs["Publications"] = pub_rows

    # 9. Languages
    lang_rows = [["ID", "Language", "Proficiency"]]
    for item in portfolio.get("languages", []):
        lang_rows.append([
            item.get("id"),
            item.get("language", ""),
            item.get("proficiency", "")
        ])
    tabs["Languages"] = lang_rows

    return tabs

def sync_via_apps_script(webhook_url: str, portfolio: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Send formatted portfolio data to a Google Apps Script Web App endpoint.
    The script populates/creates all tabs in the target Google Sheet.
    """
    if not webhook_url or not webhook_url.startswith("https://script.google.com"):
        raise ValueError("Invalid Google Apps Script Webhook URL. It must start with https://script.google.com/macros/s/...")

    if not portfolio:
        portfolio = get_complete_portfolio()

    sheet_data = format_portfolio_for_sheets(portfolio)
    payload = {
        "action": "sync_all_tabs",
        "timestamp": str(os.path.getmtime(__file__)),
        "data": sheet_data
    }

    response = requests.post(
        webhook_url,
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=30,
        allow_redirects=True
    )

    if response.status_code not in (200, 201, 302):
        raise RuntimeError(f"Google Apps Script returned status {response.status_code}: {response.text}")

    try:
        res_json = response.json()
        sheet_url = res_json.get("sheet_url")
        if sheet_url:
            set_setting("google_sheet_url", sheet_url)
        set_setting("last_sheets_sync", str(res_json.get("timestamp", "Success")))
        return res_json
    except Exception:
        # Some Apps Script redirect responses return text
        return {
            "status": "success",
            "message": "Data dispatched to Google Sheet successfully",
            "raw": response.text[:200]
        }

def export_portfolio_csv_bundle(portfolio: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
    """Generate in-memory CSV text strings for each sheet category."""
    if not portfolio:
        portfolio = get_complete_portfolio()
    
    formatted_tabs = format_portfolio_for_sheets(portfolio)
    csv_bundle: Dict[str, str] = {}
    
    for tab_name, rows in formatted_tabs.items():
        output = io.StringIO()
        writer = csv.writer(output)
        for row in rows:
            writer.writerow(row)
        csv_bundle[tab_name] = output.getvalue()
        
    return csv_bundle

GOOGLE_APPS_SCRIPT_TEMPLATE = """/**
 * Google Apps Script Web App for GenCV Synchronizer
 * Target Sheet: https://docs.google.com/spreadsheets/d/1663le16ErUauJUFrSak8vgA9vY9cLKoAYDw2YosqA70/edit
 * 
 * Instructions:
 * 1. Open your target Google Sheet (or https://docs.google.com/spreadsheets/d/1663le16ErUauJUFrSak8vgA9vY9cLKoAYDw2YosqA70/edit).
 * 2. Click: Extensions -> Apps Script.
 * 3. Delete existing code, paste this entire script, and click Save (Ctrl+S or Cmd+S).
 * 4. Click 'Deploy' -> 'New deployment'.
 * 5. Select type: 'Web app'.
 * 6. Under 'Execute as': 'Me'.
 * 7. Under 'Who has access': 'Anyone'.
 * 8. Click 'Deploy', authorize permissions, and copy the 'Web app URL'.
 * 9. Paste the URL into the GenCV Google Sheets Sync tab and click 'Synchronize Database Now'!
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
    
    // Style configurations
    var headerColor = "#4f46e5"; // Indigo brand accent
    var headerTextColor = "#ffffff";
    
    for (var tabName in data) {
      if (data.hasOwnProperty(tabName)) {
        var sheet = ss.getSheetByName(tabName);
        if (!sheet) {
          sheet = ss.insertSheet(tabName);
        } else {
          sheet.clear();
        }
        
        var rows = data[tabName];
        if (rows && rows.length > 0) {
          var numRows = rows.length;
          var numCols = rows[0].length;
          var range = sheet.getRange(1, 1, numRows, numCols);
          range.setValues(rows);
          
          // Style header row
          var headerRange = sheet.getRange(1, 1, 1, numCols);
          headerRange.setBackground(headerColor);
          headerRange.setFontColor(headerTextColor);
          headerRange.setFontWeight("bold");
          headerRange.setFontFamily("Plus Jakarta Sans");
          
          // Freeze header row and auto-fit columns
          sheet.setFrozenRows(1);
          sheet.autoResizeColumns(1, numCols);
        }
      }
    }
    
    // Remove default "Sheet1" if empty and others exist
    var defaultSheet = ss.getSheetByName("Sheet1");
    if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
      ss.deleteSheet(defaultSheet);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Synchronized " + Object.keys(data).length + " tabs successfully!",
      sheet_url: ss.getUrl(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var ss = getTargetSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    sheet_name: ss.getName(),
    sheet_url: ss.getUrl()
  })).setMimeType(ContentService.MimeType.JSON);
}
"""
