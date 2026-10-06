var TEMPLATE = `
<main>
  <div class="brand" id="brand"></div>

  <div id="staffbar" hidden>
    <div class="seg" id="seg" role="group" aria-label="Form"></div>
    <div class="sync">
      <span id="syncStatus" role="status"></span>
      <button type="button" class="link" id="syncNow" hidden>Sync now</button>
    </div>
  </div>

  <h1 id="title"></h1>
  <p class="intro" id="intro"></p>

  <form id="form" novalidate>
    <button type="button" class="secondary" id="scan" hidden>Scan badge / vCard</button>
    <p class="small" id="scanInfo" role="status" hidden></p>
    <div id="questions"></div>
    <hr id="sep">
    <div id="contact"></div>
    <div id="staffFields" hidden>
      <hr>
      <div class="field">
        <label for="f_staff_notes">My notes</label>
        <textarea id="f_staff_notes" name="staff_notes" maxlength="1000"></textarea>
      </div>
      <div class="field">
        <label for="f_captured_by">Captured by</label>
        <input id="f_captured_by" name="captured_by" type="text" maxlength="200" autocomplete="off">
      </div>
    </div>
    <div class="hp" aria-hidden="true">
      <label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
    </div>
    <p class="error" id="error" role="alert" hidden></p>
    <button type="submit" id="submit">Submit</button>
    <p class="small" id="notice" hidden></p>
    <p class="small" id="consent"></p>
  </form>

  <div class="done" id="done" hidden tabindex="-1">
    <div class="tick" aria-hidden="true">✓</div>
    <h1 id="thanks"></h1>
  </div>
</main>

<div id="scanner" hidden>
  <video id="video" playsinline muted></video>
  <p>Point the camera at the V-Card QR code on the back of the badge</p>
  <button type="button" id="scanCancel">Cancel</button>
</div>
<div class="toast" id="toast" role="status" hidden></div>
`;

(function () {
  // Shared by every page: each page is a small shell that sets data-form or data-mode on <body>.
  var BASE = new URL(".", document.currentScript.src).href;
  document.body.insertAdjacentHTML("afterbegin", TEMPLATE);

  var cfg = window.FORMS_CONFIG;
  var params = new URLSearchParams(location.search);
  // ?staff=1 turns the page into the booth-side capture tool.
  var staff = document.body.dataset.mode === "staff" || params.has("staff");
  var $ = function (id) { return document.getElementById(id); };
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var form = $("form");

  // localStorage can throw (private browsing, blocked site data).
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  };

  var formId = document.body.dataset.form || params.get("f") || (staff && store.get("lead_form")) || "general";
  if (!cfg.forms[formId]) formId = "general";
  var def;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] === false || attrs[k] == null) return;
      if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  function labelFor(f, tag, attrs) {
    var label = el(tag, attrs, [document.createTextNode(f.label + " ")]);
    if (!f.required && !staff) label.appendChild(el("span", { class: "opt", text: "(optional)" }));
    return label;
  }

  function renderField(f) {
    var id = "f_" + f.name;
    // Nothing is mandatory at the booth: a scan alone is a valid lead.
    var required = f.required && !staff;
    if (f.type === "multi") {
      var boxes = f.options.map(function (o) {
        return el("label", { class: "check" }, [
          el("input", { type: "checkbox", name: f.name, value: o }),
          document.createTextNode(o),
        ]);
      });
      return el("fieldset", { class: "field" }, [labelFor(f, "legend")].concat(boxes));
    }
    var input;
    if (f.type === "select") {
      input = el("select", { id: id, name: f.name, required: required },
        [el("option", { value: "", text: "Select…" })].concat(f.options.map(function (o) {
          return el("option", { value: o, text: o });
        })));
    } else if (f.type === "text" && !f.autocomplete) {
      input = el("textarea", { id: id, name: f.name, required: required, maxlength: 1000 });
    } else {
      input = el("input", {
        id: id, name: f.name, type: f.type, required: required,
        // Autofill would offer the staff member's own details.
        autocomplete: staff ? "off" : f.autocomplete, maxlength: 200,
      });
    }
    return el("div", { class: "field" }, [labelFor(f, "label", { for: id }), input]);
  }

  function renderQuestions() {
    def = cfg.forms[formId];
    document.title = (staff ? cfg.event : def.title) + " · " + cfg.brand;
    $("title").textContent = staff ? cfg.event : def.title;
    $("intro").textContent = def.intro;
    $("notice").textContent = def.notice || "";
    $("notice").hidden = !def.notice;
    $("questions").textContent = "";
    def.questions.forEach(function (q) { $("questions").appendChild(renderField(q)); });
    Array.prototype.forEach.call($("seg").children, function (b) {
      b.setAttribute("aria-pressed", String(b.value === formId));
    });
  }

  function showError(msg) { $("error").textContent = msg; $("error").hidden = false; }

  function newId() {
    return window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function collect() {
    var fd = new FormData(form);
    var text = function (name) { return (fd.get(name) || "").trim(); };
    var data = {
      id: newId(),
      form: formId,
      source: params.get("src") || params.get("utm_source") || (staff ? "staff" : ""),
      website: text("website"),
    };
    // Campaign tags from the link or QR code, so responses can be traced to where they came from.
    UTM_KEYS.forEach(function (k) { data[k] = (params.get(k) || "").slice(0, 100); });
    def.questions.concat(cfg.contact).forEach(function (f) {
      data[f.name] = f.type === "multi" ? fd.getAll(f.name).join(", ") : text(f.name);
    });
    if (staff) {
      data.event = cfg.event || "";
      data.staff_notes = text("staff_notes");
      data.captured_by = text("captured_by");
      data.badge_raw = badgeRaw;
      // The sheet's own timestamp is when the row synced, which can be much later.
      data.captured_at = new Date().toISOString();
    }
    return data;
  }

  function post(data) {
    // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight.
    return fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data, function (k, v) { return k === "_error" ? undefined : v; }),
    })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r.ok) return;
        var err = new Error(r.error || "Rejected");
        // "retry" means the sheet was busy, not that the lead is bad.
        err.rejected = !r.retry;
        throw err;
      });
  }

  function submitPublic() {
    var data = collect();
    if (!cfg.endpoint) {
      console.log("No endpoint configured; would submit:", data);
      showError("Form is not connected yet (no endpoint set in forms.config.js).");
      return;
    }
    var btn = $("submit");
    btn.disabled = true;
    btn.textContent = "Sending…";
    post(data)
      .then(function () {
        form.hidden = true;
        $("intro").hidden = true;
        $("title").hidden = true;
        $("done").hidden = false;
        $("done").focus();
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = "Try again";
        showError("Couldn't send — please check your connection and try again.");
      });
  }

  // --- Booth staff mode: leads are saved on the device first, then synced. ---

  var QUEUE = "lead_queue";
  var badgeRaw = "";
  var syncing = false;

  function loadQueue() {
    try { return JSON.parse(store.get(QUEUE)) || []; } catch (e) { return []; }
  }
  function saveQueue(q) { return store.set(QUEUE, JSON.stringify(q)); }

  function updateStatus() {
    var q = loadQueue();
    var rejected = q.filter(function (i) { return i._error; }).length;
    var waiting = q.length - rejected;
    var text = waiting ? waiting + " waiting to sync" : "All synced";
    if (!cfg.endpoint) text = waiting + " saved on this device — no sheet connected yet";
    if (rejected) text += " · " + rejected + " rejected by the sheet";
    $("syncStatus").textContent = text;
    $("syncNow").hidden = !cfg.endpoint || !q.length;
  }

  function sync() {
    if (syncing || !cfg.endpoint) return updateStatus();
    var item = loadQueue().filter(function (i) { return !i._error; })[0];
    if (!item) return updateStatus();
    syncing = true;
    $("syncStatus").textContent = "Syncing…";
    post(item).then(
      function () { settle(item.id, null); },
      function (err) {
        if (err.rejected) return settle(item.id, err.message);
        // Offline or flaky: leave it queued for the next attempt.
        syncing = false;
        updateStatus();
      }
    );
  }

  // Drop a synced lead; keep a rejected one (marked) so it is never lost silently.
  function settle(id, error) {
    var q = loadQueue();
    if (error) q.forEach(function (i) { if (i.id === id) i._error = error; });
    else q = q.filter(function (i) { return i.id !== id; });
    saveQueue(q);
    syncing = false;
    sync();
  }

  function toast(msg) {
    $("toast").textContent = msg;
    $("toast").hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { $("toast").hidden = true; }, 2500);
  }

  function submitStaff() {
    var data = collect();
    if (!data.name && !data.email && !data.phone && !data.badge_raw) {
      showError("Scan a badge, or enter a name, email or phone.");
      return;
    }
    var q = loadQueue();
    q.push(data);
    if (!saveQueue(q)) {
      showError("This browser can't store leads on the device (private browsing?). Nothing was saved.");
      return;
    }
    store.set("lead_staff", data.captured_by);
    form.reset();
    form.elements.captured_by.value = data.captured_by;
    badgeRaw = "";
    $("scanInfo").hidden = true;
    window.scrollTo(0, 0);
    toast("Saved " + (data.name || data.email || data.phone || "badge scan"));
    sync();
  }

  // --- contact parsing ---
  // Turns scanned QR text (vCard, MECARD, mailto or a bare email) into contact fields.
  function parseContact(raw) {
    var out = {};
    var unesc = function (s) {
      return s.replace(/\\n/gi, " ").replace(/\\([,;:\\])/g, "$1").trim();
    };
    // Unfold vCard continuation lines.
    var text = String(raw).replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").trim();

    if (/^BEGIN:VCARD/i.test(text)) {
      var n = "";
      text.split("\n").forEach(function (line) {
        var i = line.indexOf(":");
        if (i < 0) return;
        // "item1.EMAIL;TYPE=work" -> "EMAIL"
        var key = line.slice(0, i).split(";")[0].replace(/^.*\./, "").toUpperCase();
        var val = line.slice(i + 1).trim();
        if (!val) return;
        if (key === "FN") out.name = unesc(val);
        else if (key === "N") {
          var p = val.split(";");
          n = unesc([p[1], p[0]].filter(Boolean).join(" "));
        }
        else if (key === "EMAIL" && !out.email) out.email = unesc(val);
        else if (key === "TEL" && !out.phone) out.phone = unesc(val.replace(/^tel:/i, ""));
        else if (key === "ORG") out.company = unesc(val.split(";")[0]);
        else if (key === "TITLE") out.title = unesc(val);
      });
      if (!out.name && n) out.name = n;
    } else if (/^MECARD:/i.test(text)) {
      text.slice(7).split(";").forEach(function (part) {
        var i = part.indexOf(":");
        if (i < 0) return;
        var key = part.slice(0, i).toUpperCase();
        var val = unesc(part.slice(i + 1));
        if (!val) return;
        if (key === "N") {
          var p = val.split(",");
          out.name = [p[1], p[0]].filter(Boolean).join(" ").trim();
        }
        else if (key === "EMAIL" && !out.email) out.email = val;
        else if (key === "TEL" && !out.phone) out.phone = val;
        else if (key === "ORG") out.company = val;
      });
    } else {
      var m = text.match(/^(?:mailto:)?([^\s@?]+@[^\s@?]+\.[^\s@?]+)/i);
      if (m) out.email = m[1];
    }
    return out;
  }
  // --- end contact parsing ---

  function applyScan(text) {
    var c = parseContact(text);
    var found = Object.keys(c).filter(function (k) { return c[k]; });
    // Clear the previous person so two attendees never get mixed.
    cfg.contact.forEach(function (f) { form.elements[f.name].value = ""; });
    found.forEach(function (k) { if (form.elements[k]) form.elements[k].value = c[k]; });
    // Many event badges carry only an attendee ID; keep it so the organiser's list can match it later.
    badgeRaw = found.length ? "" : text.slice(0, 500);
    $("scanInfo").textContent = found.length
      ? "Scanned " + (c.name || c.email || "contact") + ". Check the details below."
      : "That code has no contact details (it reads “" + text.slice(0, 60) + "”). If the badge has a second QR code, scan that one instead; otherwise this is saved as a badge reference and you can type the name in.";
    $("scanInfo").hidden = false;
  }

  var video = $("video");
  var stream = null;
  var scanning = false;
  var detector = null;
  var canvas = null;

  function loadJsQR() {
    return new Promise(function (resolve, reject) {
      if (window.jsQR) return resolve();
      var s = el("script", { src: BASE + "vendor/jsQR.js" });
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Native detector where the browser has one (Android Chrome); jsQR elsewhere (iOS Safari).
  function prepareDecoder() {
    if (detector || window.jsQR) return Promise.resolve();
    if (!("BarcodeDetector" in window)) return loadJsQR();
    return BarcodeDetector.getSupportedFormats().then(function (formats) {
      if (formats.indexOf("qr_code") === -1) return loadJsQR();
      detector = new BarcodeDetector({ formats: ["qr_code"] });
    });
  }

  function readFrame() {
    if (detector) {
      return detector.detect(video).then(function (codes) {
        // Badges can carry a second, non-contact QR code next to the vCard one.
        var values = codes.map(function (c) { return c.rawValue; });
        var card = values.filter(function (v) { return /^(BEGIN:VCARD|MECARD:)/i.test(v); })[0];
        return card || values[0] || "";
      });
    }
    if (!video.videoWidth) return "";
    canvas = canvas || document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0);
    var hit = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
    return hit ? hit.data : "";
  }

  function tick() {
    if (!scanning) return;
    Promise.resolve().then(readFrame).catch(function () { return ""; }).then(function (text) {
      if (!scanning) return;
      if (!text) return setTimeout(tick, 150);
      stopScan();
      applyScan(text);
    });
  }

  function startScan() {
    $("error").hidden = true;
    if (!navigator.mediaDevices) {
      showError("The camera needs this page to be opened over https.");
      return;
    }
    prepareDecoder()
      .then(function () {
        return navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      })
      .then(function (s) {
        stream = s;
        video.srcObject = s;
        $("scanner").hidden = false;
        scanning = true;
        return video.play();
      })
      .then(tick)
      .catch(function () {
        stopScan();
        showError("Couldn't open the camera. Allow camera access, or type the details in.");
      });
  }

  function stopScan() {
    scanning = false;
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    stream = null;
    video.srcObject = null;
    $("scanner").hidden = true;
  }

  function initStaff() {
    $("staffbar").hidden = false;
    $("scan").hidden = false;
    $("staffFields").hidden = false;
    $("intro").hidden = true;
    $("consent").hidden = true;
    $("submit").textContent = "Save lead";
    // Contact comes first at the booth: scan, then the optional questions.
    form.insertBefore($("contact"), $("questions"));
    form.insertBefore($("sep"), $("questions"));
    form.elements.captured_by.value = store.get("lead_staff") || "";

    Object.keys(cfg.forms).forEach(function (id) {
      var b = el("button", { type: "button", value: id, text: cfg.forms[id].label || id });
      b.addEventListener("click", function () {
        formId = id;
        store.set("lead_form", id);
        renderQuestions();
      });
      $("seg").appendChild(b);
    });

    $("scan").addEventListener("click", startScan);
    $("scanCancel").addEventListener("click", stopScan);
    $("syncNow").addEventListener("click", function () {
      // A manual sync also retries anything the sheet rejected earlier.
      saveQueue(loadQueue().map(function (i) { delete i._error; return i; }));
      sync();
    });
    window.addEventListener("online", sync);
    setInterval(sync, 30000);
    // Lets the page itself open without a connection after the first visit.
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(BASE + "sw.js", { scope: "./" }).catch(function () {});
  }

  $("brand").textContent = cfg.brand;
  $("consent").textContent = cfg.consent;
  $("thanks").textContent = cfg.thanks;
  cfg.contact.forEach(function (c) { $("contact").appendChild(renderField(c)); });
  if (staff) initStaff();
  renderQuestions();
  if (staff) sync();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    $("error").hidden = true;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (staff) submitStaff();
    else submitPublic();
  });
})();
