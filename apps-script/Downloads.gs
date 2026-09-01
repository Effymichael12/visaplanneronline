/**
 * Handles the free-resource "Download for Free" popup on index.html.
 *
 * Called from doPost() in Code.gs whenever the submitted `formType` is
 * "download". Logs the request to a "Downloads" tab in the bound Google
 * Sheet, and emails the requester a PDF of the guide they asked for.
 */

var DOWNLOADS_SHEET_NAME = "Downloads";

// One entry per "Download for Free" button on the site — the key here
// must match that button's `data-resource` attribute in index.html.
//
// driveFileId: leave blank to send an auto-generated placeholder PDF
// (handy for testing the whole pipeline before you have real guides).
// Once you have a real PDF: upload it to Google Drive, open it, copy the
// file ID out of the URL (.../d/FILE_ID/view), and paste it in below.
var RESOURCE_LIBRARY = {
  "f1-visa-guide": {
    title: "F-1 Visa Interview Preparation Guide",
    driveFileId: "1lhDrqptxkC6S6fvXcxRdvzh8U67PzxOI",
  },
  "usa-arrival-checklist": {
    title: "Moving to America: Your First 30 Days",
    driveFileId: "17BMiomg4Fx8xfl9a9C3pMoZsd8PEo3Al",
  },
  "uk-arrival-checklist": {
    title: "UK Student Arrival Checklist",
    driveFileId: "1FHrDf8Xr1troQam6uC18yrkhAyDPGnn1",
  },
  "canada-arrival-guide": {
    title: "Canada Student Arrival Guide",
    driveFileId: "1KR7TR2VakcVfrDm2ZNgC6_Mjplot7gwa",
  },
  "general-document-checklist": {
    title: "Student Visa Document Checklist",
    driveFileId: "1IjRPQ3Z8fAgHo5ulct-MT69czroQaUFq",
  },
};

function handleDownloadRequest_(p) {
  var email = p.email || "";
  var slug = p.resourceSlug || "";
  var resource = RESOURCE_LIBRARY[slug];
  var title = (resource && resource.title) || p.resourceTitle || "Free Guide";

  var sheet = getOrCreateSheet_(DOWNLOADS_SHEET_NAME, [
    "Timestamp",
    "Email",
    "Resource",
    "Resource Slug",
  ]);

  var status = "";
  if (email) {
    try {
      var pdfBlob = getResourcePdf_(resource, title);
      sendResourceEmail_(email, title, pdfBlob);
      status = "sent";
    } catch (err) {
      // The client can't read this response (no-cors), so record the
      // failure in the sheet itself — otherwise a broken send is invisible.
      status = "EMAIL FAILED: " + err;
    }
  } else {
    status = "no email provided";
  }

  sheet.appendRow([new Date(), email, title, slug + " — " + status]);

  return jsonResponse_({ result: "success" });
}

/**
 * Returns a PDF blob for the given resource: the real file from Drive if
 * a driveFileId is configured, otherwise a simple auto-generated
 * placeholder so the whole pipeline can be tested end-to-end first.
 */
function getResourcePdf_(resource, title) {
  if (resource && resource.driveFileId) {
    return DriveApp.getFileById(resource.driveFileId).getBlob();
  }
  return createPlaceholderPdf_(title);
}

function createPlaceholderPdf_(title) {
  var doc = DocumentApp.create(
    "TEMP - " + title + " - " + new Date().getTime(),
  );
  var body = doc.getBody();
  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph(
    "This is a placeholder PDF from Visa Planner Online, generated automatically to test " +
      "the download pipeline end-to-end. Replace it with the real guide by uploading a PDF " +
      "to Google Drive and adding its file ID to RESOURCE_LIBRARY above.",
  );
  doc.saveAndClose();

  var pdfBlob = DriveApp.getFileById(doc.getId()).getAs(MimeType.PDF);
  pdfBlob.setName(title + ".pdf");

  // Clean up the temporary Google Doc now that we've exported it as a PDF.
  DriveApp.getFileById(doc.getId()).setTrashed(true);

  return pdfBlob;
}

/**
 * Manual test helper — NOT called by doPost. Run this directly from the
 * Apps Script editor (select "debugSendTestEmail" in the function
 * dropdown at the top, click Run) to test PDF generation + email sending
 * with a real stack trace instead of the silent try/catch in
 * handleDownloadRequest_. If this throws, the error under View ->
 * Executions is the real problem (commonly: the Drive/Docs/Gmail scopes
 * haven't been authorized yet for this project — running any function
 * here, including this one, is what triggers that consent screen).
 *
 * Edit YOUR_EMAIL below before running.
 */
function debugSendTestEmail() {
  var toEmail = "YOUR_EMAIL@example.com"; // <-- change this
  var pdfBlob = createPlaceholderPdf_("Debug Test Guide");
  sendResourceEmail_(toEmail, "Debug Test Guide", pdfBlob);
  Logger.log("Sent to " + toEmail);
}

// Must be a verified "Send mail as" alias on the Gmail account running this
// script (Gmail -> Settings -> Accounts and Import -> Send mail as), or
// MailApp.sendEmail throws and every download request will silently fail
// (logged as "EMAIL FAILED" in the Downloads sheet). Don't set this until
// that verification is done.
var SEND_FROM_EMAIL = "ephraim@visaplanneronline.com";
var SEND_FROM_NAME = "Visa Planner Online";

function sendResourceEmail_(toEmail, title, pdfBlob) {
  MailApp.sendEmail({
    to: toEmail,
    from: SEND_FROM_EMAIL,
    name: SEND_FROM_NAME,
    subject: "Your free guide: " + title,
    body:
      'Hi,\n\nThanks for requesting "' +
      title +
      "\" from Visa Planner Online. It's attached to this email as a PDF.\n\n" +
      "If you have any questions about your visa journey, just reply to this email " +
      "or book a free consultation on our site.\n\n" +
      "— The Visa Planner Online team",
    attachments: [pdfBlob],
  });
}
