/**
 * Hero "Free Discovery Call" form: serverless submission to
 * Google Sheets, same pattern as js/contact-form.js (see that file for
 * the full setup walkthrough — both forms share the same Apps Script
 * deployment, routed by the `formType` field).
 */
(function () {
  "use strict";

  var GOOGLE_SHEETS_ENDPOINT = window.VPO_APPS_SCRIPT_URL || "";

  var form = document.getElementById("heroConsultForm");
  if (!form) return;

  var statusEl = form.querySelector(".contact-form__status");
  var submitBtn = form.querySelector(".hero-form__submit");

  function setStatus(message, kind) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = "contact-form__status" + (kind ? " contact-form__status--" + kind : "");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!GOOGLE_SHEETS_ENDPOINT || GOOGLE_SHEETS_ENDPOINT.indexOf("PASTE_YOUR_") === 0) {
      setStatus(
        "Form isn't connected yet — add your Google Apps Script URL in js/config.js.",
        "error"
      );
      return;
    }

    submitBtn.disabled = true;
    var originalLabel = submitBtn.textContent;
    submitBtn.textContent = "Sending…";
    setStatus("");

    var formData = new FormData(form);

    // mode: "no-cors" is required because Apps Script web apps don't send
    // CORS headers. We can't read the response back, but the POST still
    // reaches the script and gets written to the Sheet — so we treat a
    // fetch that doesn't throw as a success.
    fetch(GOOGLE_SHEETS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    })
      .then(function () {
        setStatus("Thanks! We've received your details and will be in touch to book your call.", "success");
        form.reset();
      })
      .catch(function () {
        setStatus("Something went wrong. Please try again or email us directly.", "error");
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
  });
})();
