/**
 * Router + shared helpers for the Visa Planner Online site's forms.
 *
 * The actual per-form logic lives in its own file:
 *   - Contact.gs      -> the "Connect With Us" contact form
 *   - Downloads.gs    -> the free-resource download popup (logs + emails a PDF)
 *   - Consultation.gs -> the hero "Free Discovery Call" form
 *   - Offers.gs       -> logs clicks on the paid-service buttons
 *
 * Apps Script compiles every .gs file in a project into one shared global
 * scope, so it doesn't matter which file a function is defined in — this
 * split is purely for readability. Paste all five .gs files into the same
 * Apps Script project (see README.md); nothing here needs a project per
 * file or a separate deployment.
 */

// Bump this string any time you edit any of these files, then create
// a new deployment version. Opening the deployed /exec URL in a browser
// (a GET request) shows this back to you, so you can confirm the live
// deployment actually has your latest edits without digging through
// Deploy -> Manage deployments.
var CODE_VERSION = "2026-11-owner-notifications";

// Every form submission / download / service click is announced to this
// inbox so you can follow up quickly (client success). Change it here only.
var NOTIFY_EMAIL = "ephraim@visaplanneronline.com";

function doPost(e) {
  var p = (e && e.parameter) || {};
  var formType = p.formType || "contact";

  if (formType === "download") {
    return handleDownloadRequest_(p); // defined in Downloads.gs
  }

  if (formType === "offer_click") {
    return handleOfferClick_(p); // defined in Offers.gs
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
  } else if (sheet.getLastColumn() < headerRow.length) {
    // Columns were added to an existing tab (e.g. "Source Page"): write
    // the full header row so the new columns are labelled.
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
  }

  return sheet;
}

/**
 * Emails NOTIFY_EMAIL about an event. Never throws: a failed notification
 * must not stop the submission from being logged or the guide being sent.
 *
 * subject  - short headline (newlines are stripped; it contains user input)
 * fields   - array of [label, value] pairs shown in the body
 * replyTo  - optional visitor email, so you can just hit Reply
 */
function notifyOwner_(subject, fields, replyTo) {
  try {
    var lines = fields.map(function (f) {
      return f[0] + ": " + (f[1] || "-");
    });
    var options = {
      to: NOTIFY_EMAIL,
      name: "Visa Planner Online (site)",
      subject: String(subject).replace(/[\r\n]+/g, " ").substring(0, 150),
      body: lines.join("\n") + "\n\nLogged in your Google Sheet.",
    };
    if (replyTo && /^[^\s@]+@[^\s@]+$/.test(replyTo)) {
      options.replyTo = replyTo;
    }
    MailApp.sendEmail(options);
  } catch (err) {
    Logger.log("notifyOwner_ failed: " + err);
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
