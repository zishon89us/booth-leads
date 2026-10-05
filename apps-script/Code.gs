// Bound to the leads Google Sheet (Extensions → Apps Script).
// Each form gets its own tab; columns are created from the submitted fields.

var ALLOWED_FORMS = ['general', 'healthcare'];
var MAX_LEN = 1000;

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    var data = JSON.parse(e.postData.contents);
    if (ALLOWED_FORMS.indexOf(data.form) === -1) return json({ ok: false, error: 'Unknown form' });
    // Honeypot: bots fill the hidden field. Pretend success, store nothing.
    if (data.website) return json({ ok: true });
    // Booth scans may carry only a badge reference, so any one identifier is enough.
    if (!data.name && !data.email && !data.phone && !data.badge_raw) {
      return json({ ok: false, error: 'No contact details' });
    }
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
      return json({ ok: false, error: 'Invalid email' });
    }

    var form = data.form;
    delete data.form;
    delete data.website;

    // Rows are written one at a time. If the queue is too long, ask the sender to retry.
    locked = lock.tryLock(25000);
    if (!locked) return json({ ok: false, retry: true, error: 'Busy' });
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(form) || ss.insertSheet(form);
    var headers = sheet.getLastColumn()
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      : [];
    if (!headers.length) headers = ['timestamp'];

    // The booth app retries until it hears back, so the same lead can arrive twice.
    var idCol = headers.indexOf('id');
    if (data.id && idCol !== -1 && sheet.getLastRow() > 1) {
      var seen = sheet.getRange(2, idCol + 1, sheet.getLastRow() - 1, 1)
        .createTextFinder(String(data.id)).matchEntireCell(true).findNext();
      if (seen) return json({ ok: true });
    }

    // Only touch the header row when a new field shows up; it is the slow part.
    var added = false;
    Object.keys(data).forEach(function (k) {
      if (headers.indexOf(k) === -1) { headers.push(k); added = true; }
    });
    if (added) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow(headers.map(function (h) {
      return h === 'timestamp' ? new Date() : clean(data[h]);
    }));
    return json({ ok: true });
  } catch (err) {
    // Anything unexpected here is most likely a passing Sheets hiccup.
    return json({ ok: false, retry: true, error: String(err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

// Truncate, and neutralise values a spreadsheet would run as a formula.
function clean(v) {
  var s = String(v == null ? '' : v).slice(0, MAX_LEN);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
