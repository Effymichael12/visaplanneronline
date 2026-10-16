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
  ]);

  var phone = ((p.phoneCountryCode || "") + " " + (p.phone || "")).trim();

  sheet.appendRow([
    new Date(),
    p.fullName || "",
    p.email || "",
    phone,
    p.countryOfResidence || "",
    p.visaType || "",
  ]);

  return jsonResponse_({ result: "success" });
}
