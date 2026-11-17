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
    "Source Page",
    "Phone",
  ]);

  var phone = ((p.phoneCountryCode || "") + " " + (p.phone || "")).trim();

  sheet.appendRow([
    new Date(),
    p.firstName || "",
    p.email || "",
    p.currentCountry || "",
    p.destination || "",
    p.visaType || "",
    p.message || "",
    p.sourcePage || "",
    phone,
  ]);

  notifyOwner_(
    "New contact message: " + (p.firstName || "someone"),
    [
      ["Name", p.firstName],
      ["Email", p.email],
      ["Phone", phone],
      ["Current country", p.currentCountry],
      ["Destination", p.destination],
      ["Visa type", p.visaType],
      ["Message", p.message],
      ["Page", p.sourcePage],
    ],
    p.email
  );

  return jsonResponse_({ result: "success" });
}
