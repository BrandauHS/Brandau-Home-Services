/* ============================================================================
   BRANDAU HOME SERVICES — Analytics + Cookie Consent (Google Consent Mode v2)
   ----------------------------------------------------------------------------
   HOW TO TURN IT ON:
   1) Create a free Google Analytics 4 property and copy your Measurement ID
      (it looks like "G-XXXXXXXXXX").
   2) Paste it between the quotes on the GA_MEASUREMENT_ID line below.
   3) That's it. Until an ID is set, this file does nothing (no cookies, no
      banner) — the site stays perfectly clean.

   WHAT IT DOES (once an ID is set):
   - Loads Google Analytics only AFTER the visitor accepts the cookie banner
     (Google Consent Mode v2 — everything defaults to "denied" first).
   - If the visitor declines, nothing is sent to Google at all.
   - Automatically tracks the useful actions: quote-form submissions, clicks to
     call, clicks to text, and opening the Snap Diagnosis tool.
   - No personal info (name, address, email, phone) is ever put into an event.
   ============================================================================ */
(function () {
  // ====== PASTE YOUR GOOGLE ANALYTICS MEASUREMENT ID HERE ======
  var GA_MEASUREMENT_ID = "G-SFE0PTDKJ3"; // e.g. "G-ABCD1234EF"
  // =============================================================

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // No ID yet → do nothing at all, but keep a safe no-op so page scripts never error.
  if (!GA_MEASUREMENT_ID) { window.bhsTrack = function () {}; return; }

  var STORE_KEY = "bhs_consent_v1";
  var stored = null;
  try { stored = localStorage.getItem(STORE_KEY); } catch (e) {}

  // Google Consent Mode v2 — deny everything until the visitor chooses.
  gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500
  });

  var gaLoaded = false;
  function loadGA() {
    if (gaLoaded) return; gaLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  function grant() {
    gtag("consent", "update", {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted"
    });
    loadGA();
  }

  // event helper other scripts can call: bhsTrack('name', {param:1})
  window.bhsTrack = function (name, params) { try { gtag("event", name, params || {}); } catch (e) {} };

  // let the privacy page reopen the choice
  window.bhsResetConsent = function () { try { localStorage.removeItem(STORE_KEY); } catch (e) {} location.reload(); };

  function persist(v) { try { localStorage.setItem(STORE_KEY, v); } catch (e) {} }

  // Apply a remembered choice, or show the banner.
  if (stored === "granted") { grant(); }
  else if (stored === "denied") { /* nothing loads */ }
  else { onReady(showBanner); }

  // ---- auto-track the high-value actions ----
  onReady(function () {
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (href.indexOf("tel:") === 0) window.bhsTrack("contact_call", { transport_type: "beacon" });
      else if (href.indexOf("sms:") === 0) window.bhsTrack("contact_text", {});
      else if (href.indexOf("snap-diagnosis") !== -1) window.bhsTrack("snap_open", {});
    }, true);

    Array.prototype.forEach.call(document.querySelectorAll('form[action*="formspree"]'), function (f) {
      f.addEventListener("submit", function () {
        var page = (document.title || "").split("|")[0].trim();
        window.bhsTrack("generate_lead", { form_location: page || "quote" });
      });
    });
  });

  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // ---- cookie consent banner ----
  function showBanner() {
    if (document.getElementById("bhs-consent")) return;

    var css = document.createElement("style");
    css.textContent =
      "#bhs-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:2000;max-width:560px;margin:0 auto;" +
      "background:#fff;border:1px solid #e3ebf0;border-radius:16px;box-shadow:0 24px 60px -24px rgba(10,22,32,.4);" +
      "padding:18px 20px;font-family:'Inter',system-ui,sans-serif;}" +
      "#bhs-consent p{margin:0 0 12px;color:#42525b;font-size:.92rem;line-height:1.55;}" +
      "#bhs-consent a{color:#1477a8;text-decoration:underline;}" +
      "#bhs-consent .bhs-consent-row{display:flex;gap:10px;flex-wrap:wrap;}" +
      "#bhs-consent button{flex:1;min-width:130px;border:none;cursor:pointer;border-radius:10px;padding:11px 16px;" +
      "font-family:'Space Grotesk','Inter',sans-serif;font-weight:700;font-size:.95rem;}" +
      "#bhs-consent .bhs-accept{background:#0091c9;color:#fff;}" +
      "#bhs-consent .bhs-accept:hover{background:#0079a8;}" +
      "#bhs-consent .bhs-decline{background:#eef3f6;color:#0C3A52;}" +
      "#bhs-consent .bhs-decline:hover{background:#e2eaef;}" +
      "@media(max-width:760px){#bhs-consent{bottom:84px;}}";
    document.head.appendChild(css);

    var box = document.createElement("div");
    box.id = "bhs-consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Cookie consent");
    box.innerHTML =
      '<p>We use cookies to understand how visitors use our site so we can improve it. ' +
      'You can accept analytics cookies or decline — either way the site works the same. ' +
      'See our <a href="privacy.html">Privacy Policy</a>.</p>' +
      '<div class="bhs-consent-row">' +
      '<button class="bhs-accept" type="button">Accept</button>' +
      '<button class="bhs-decline" type="button">Decline</button>' +
      '</div>';
    document.body.appendChild(box);

    box.querySelector(".bhs-accept").addEventListener("click", function () {
      persist("granted"); grant(); box.remove();
    });
    box.querySelector(".bhs-decline").addEventListener("click", function () {
      persist("denied"); box.remove();
    });
  }
})();
