/**
 * Free-resource download popup.
 *
 * Clicking any "Download for Free" button opens a small modal asking for
 * an email address. On submit, the email + which resource was requested
 * are sent to the same Google Apps Script Web App used by the contact
 * form (see js/config.js), which emails the requester a PDF and logs the
 * request in a "Downloads" tab in the Sheet.
 */
(function () {
  "use strict";

  var ENDPOINT = window.VPO_APPS_SCRIPT_URL || "";

  var modal = document.getElementById("resourceModal");
  if (!modal) return;

  var dialog = modal.querySelector(".modal__dialog");
  var form = document.getElementById("resourceForm");
  var resourceNameEl = document.getElementById("resourceModalResourceName");
  var resourceSlugInput = document.getElementById("resourceSlug");
  var resourceTitleInput = document.getElementById("resourceTitle");
  var statusEl = form.querySelector(".contact-form__status");
  var submitBtn = form.querySelector(".modal__submit");
  var lastFocusedEl = null;

  function setStatus(message, kind) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = "contact-form__status" + (kind ? " contact-form__status--" + kind : "");
  }

  function openModal(slug, title) {
    lastFocusedEl = document.activeElement;
    resourceSlugInput.value = slug || "";
    resourceTitleInput.value = title || "";
    resourceNameEl.textContent = title ? '"' + title + '"' : "this guide";
    setStatus("");
    form.reset();
    resourceSlugInput.value = slug || "";
    resourceTitleInput.value = title || "";

    modal.hidden = false;
    document.body.classList.add("modal-open");
    var emailInput = document.getElementById("resourceEmail");
    if (emailInput) emailInput.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
  }

  // Open on any "Download for Free" button
  document.querySelectorAll(".resource-card__btn[data-resource]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openModal(btn.dataset.resource, btn.dataset.resourceTitle);
    });
  });

  // Close on backdrop click / close button
  modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  // Close on Escape
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  // Don't close when clicking inside the dialog itself
  if (dialog) {
    dialog.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }

  // ---- Submission ----
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!ENDPOINT || ENDPOINT.indexOf("PASTE_YOUR_") === 0) {
      setStatus("Form isn't connected yet — add your Google Apps Script URL in js/config.js.", "error");
      return;
    }

    submitBtn.disabled = true;
    var originalLabel = submitBtn.textContent;
    submitBtn.textContent = "Sending…";
    setStatus("");

    var formData = new FormData(form);

    // Same no-cors trade-off as the contact form: we can't read the
    // response, so we treat a fetch that doesn't throw as success.
    fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    })
      .then(function () {
        setStatus("Check your inbox! Your PDF is on its way.", "success");
        setTimeout(closeModal, 1800);
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
