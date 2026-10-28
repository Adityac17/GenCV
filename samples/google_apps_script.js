/**
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
    
    // Remove default "Sheet1" if empty and other tabs exist
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
