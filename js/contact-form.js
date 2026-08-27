/**
 * Contact form: visa-type toggle + serverless submission to Google Sheets.
 *
 * This site is static (GitHub Pages, no server), so submissions are sent
 * straight to a Google Apps Script "Web App" that's bound to a Google
 * Sheet — Apps Script plays the role a backend would normally play.
 *
 * SETUP (one-time, in your Google account):
 *   1. Create a Google Sheet to collect submissions.
 *   2. In the Sheet, go to Extensions -> Apps Script.
 *   3. Delete the placeholder code and paste in the contents of
 *      apps-script/Code.gs from this repo. Save.
 *   4. Click Deploy -> New deployment -> select type "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   5. Click Deploy, authorize it, then copy the "Web app URL" it gives you
 *      (ends in /exec).
 *   6. Paste that URL into js/config.js as VPO_APPS_SCRIPT_URL.
 *
 * Full walkthrough: apps-script/README.md
 */
(function () {
  "use strict";

  var GOOGLE_SHEETS_ENDPOINT = window.VPO_APPS_SCRIPT_URL || "";

  var form = document.getElementById("contactForm");
  if (!form) return;

  var visaTypeInput = form.querySelector("#visaType");
  var toggleButtons = form.querySelectorAll(".visa-type-toggle__option");
  var statusEl = form.querySelector(".contact-form__status");
  var submitBtn = form.querySelector(".contact-form__submit");

  // ---- Visa type toggle (Student Visa / Visitor Visa) ----
  toggleButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      toggleButtons.forEach(function (b) {
        b.classList.remove("visa-type-toggle__option--active");
      });
      btn.classList.add("visa-type-toggle__option--active");
      if (visaTypeInput) visaTypeInput.value = btn.dataset.value || "";
    });
  });

  function setStatus(message, kind) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = "contact-form__status" + (kind ? " contact-form__status--" + kind : "");
  }

  function resetVisaToggle() {
    toggleButtons.forEach(function (b, i) {
      b.classList.toggle("visa-type-toggle__option--active", i === 0);
    });
    if (visaTypeInput && toggleButtons.length) {
      visaTypeInput.value = toggleButtons[0].dataset.value || "";
    }
  }

  // ---- Submission ----
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
        setStatus("Thanks! We've received your message and will be in touch soon.", "success");
        form.reset();
        resetVisaToggle();
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
