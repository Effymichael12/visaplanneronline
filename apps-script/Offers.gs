/**
 * Logs clicks on the paid-service buttons (Strategic Advice, audits, etc.)
 * on the country pages. The buttons link out to Google Forms / Google
 * Calendar, which we can't see into, so this records the *interest*: which
 * service was clicked, and on which page. No personal data is involved, so
 * it goes to a sheet only (no email). Turn on notifications inside each
 * Google Form itself (Responses -> bell icon) to be told when one is
 * actually filled in.
 */

var OFFER_CLICKS_SHEET_NAME = "OfferClicks";

function handleOfferClick_(p) {
  var sheet = getOrCreateSheet_(OFFER_CLICKS_SHEET_NAME, [
    "Timestamp",
    "Service",
    "Source Page",
  ]);

  sheet.appendRow([new Date(), p.offer || "", p.sourcePage || ""]);

  return jsonResponse_({ result: "success" });
}
