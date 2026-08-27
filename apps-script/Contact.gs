/**
 * Handles the "Connect With Us" contact form on index.html.
 *
 * Called from doPost() in Code.gs whenever the submitted `formType` is
 * "contact" (or missing, for older submissions). Appends one row per
 * submission to a "Submissions" tab in the bound Google Sheet.
 */

var SUBMISSIONS_SHEET_NAME = "Submissions";

function handleContactSubmission_(p) {
  var sheet = getOrCreateSheet_(SUBMISSIONS_SHEET_NAME, [
    "Timestamp",
    "First Name",
    "Email",
    "Current Country",
    "Destination",
    "Visa Type",
    "Message",
  ]);

  sheet.appendRow([
    new Date(),
    p.firstName || "",
    p.email || "",
    p.currentCountry || "",
    p.destination || "",
    p.visaType || "",
    p.message || "",
  ]);

  return jsonResponse_({ result: "success" });
}
