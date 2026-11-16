/**
 * Logs clicks on the paid-service buttons (any link with data-offer) to the
 * Apps Script "OfferClicks" tab. The links open Google Forms / Calendar in a
 * new tab, so this is fire-and-forget and never delays or blocks the click.
 */
(function () {
  "use strict";

  var ENDPOINT = window.VPO_APPS_SCRIPT_URL || "";
  if (!ENDPOINT) return;

  document.querySelectorAll("a[data-offer]").forEach(function (link) {
    link.addEventListener("click", function () {
      try {
        var data = new FormData();
        data.append("formType", "offer_click");
        data.append("offer", link.getAttribute("data-offer"));
        data.append("sourcePage", window.location.pathname);
        fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: data, keepalive: true });
      } catch (e) {
        /* tracking must never interfere with the click */
      }
    });
  });
})();
