/**
 * Router + shared helpers for the Visa Planner Online site's forms.
 *
 * The actual per-form logic lives in its own file:
 *   - Contact.gs      -> the "Connect With Us" contact form
 *   - Downloads.gs    -> the free-resource download popup (logs + emails a PDF)
 *   - Consultation.gs -> the hero "Free 30-Minute Consultation" form
 *
 * Apps Script compiles every .gs file in a project into one shared global
 * scope, so it doesn't matter which file a function is defined in — this
 * split is purely for readability. Paste all four files into the same
 * Apps Script project (see README.md); nothing here needs a project per
 * file or a separate deployment.
 */

// Bump this string any time you edit any of these files, then create
// a new deployment version. Opening the deployed /exec URL in a browser
// (a GET request) shows this back to you, so you can confirm the live
// deployment actually has your latest edits without digging through
// Deploy -> Manage deployments.
var CODE_VERSION = "2026-10-workspace-migration";

function doPost(e) {
  var p = (e && e.parameter) || {};
  var formType = p.formType || "contact";

  if (formType === "download") {
    return handleDownloadRequest_(p); // defined in Downloads.gs
  }

  if (formType === "consultation") {
    return handleConsultationRequest_(p); // defined in Consultation.gs
  }

  return handleContactSubmission_(p); // defined in Contact.gs
}

// Lets you open the deployed /exec URL directly in a browser to sanity-check
// that the deployment is live (GET requests don't write any data or send
// any email).
function doGet(e) {
  return jsonResponse_({
    status: "ok",
    message: "Visa Planner Online form endpoint is live.",
    version: CODE_VERSION,
  });
}

// ---- Shared helpers (used by both Contact.gs and Downloads.gs) ----

function getOrCreateSheet_(name, headerRow) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headerRow);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
