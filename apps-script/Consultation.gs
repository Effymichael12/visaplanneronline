/**
 * Handles the "Free 30-Minute Consultation" form in the homepage hero.
 *
 * Called from doPost() in Code.gs whenever the submitted `formType` is
 * "consultation". Appends one row per submission to a "Consultations" tab
 * in the bound Google Sheet.
 */

var CONSULTATIONS_SHEET_NAME = "Consultations";

function handleConsultationRequest_(p) {
  var sheet = getOrCreateSheet_(CONSULTATIONS_SHEET_NAME, [
    "Timestamp",
    "Full Name",
    "Email",
    "Phone",
    "Country of Residence",
    "Visa Type",
    "Source Page",
  ]);

  var phone = ((p.phoneCountryCode || "") + " " + (p.phone || "")).trim();

  sheet.appendRow([
    new Date(),
    p.fullName || "",
    p.email || "",
    phone,
    p.countryOfResidence || "",
    p.visaType || "",
    p.sourcePage || "",
  ]);

  notifyOwner_(
    "New discovery call request: " + (p.fullName || "someone"),
    [
      ["Name", p.fullName],
      ["Email", p.email],
      ["Phone", phone],
      ["Country of residence", p.countryOfResidence],
      ["Visa type", p.visaType],
      ["Page", p.sourcePage],
    ],
    p.email
  );

  return jsonResponse_({ result: "success" });
}
