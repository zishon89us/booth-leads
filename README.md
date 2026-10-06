# Expo intake forms

Two short lead-capture forms served from one static page, writing to a Google Sheet.

- General: `/dir-connect-26/general/`
- Healthcare: `/dir-connect-26/unifhi-healthcare/`

- Booth staff: `/dir-connect-26/?staff=1`

Add `?src=<label>` to a form link to tag where a lead came from.

## Booth staff mode

Open `/dir-connect-26/?staff=1` on your own phone or tablet. It must be served over https for the camera to work.

It installs as an app (PWA): on Android Chrome use menu → **Install app**; on iPhone Safari use
Share → **Add to Home Screen**. Open it once while online so it can cache itself; after that
it opens and saves leads without a connection.

1. Pick General or Healthcare.
2. Tap **Scan badge / vCard** and point at the attendee's QR code. vCard and MECARD codes
   fill in name, email, phone, organization and job title. A code with no contact details
   (many event badges carry only an attendee ID) is saved in `badge_raw` instead.
3. Ask the optional questions if they are interested, add your own notes, tap **Save lead**.

Leads are saved on the device first and synced to the sheet when there is a connection; the
status line under the form switch shows how many are waiting. Do not clear the browser's
site data while leads are waiting. Staff rows have `source = staff`, plus `staff_notes`,
`captured_by` and `captured_at`.

## Setup

1. **Sheet + backend**
   - Create a Google Sheet, then Extensions → Apps Script.
   - Replace the editor contents with `apps-script/Code.gs`.
   - Deploy → New deployment → Web app. Execute as: **Me**. Who has access: **Anyone**.
   - Copy the web app URL (ends in `/exec`) into `endpoint` in `forms.config.js`.
2. **Host** the root `index.html` and the whole `dir-connect-26/` folder on any static host (Netlify, Cloudflare Pages, GitHub Pages, S3).
3. **QR codes**: `./make-qr.sh https://<your-host>` writes PNG and SVG files to `qr/`.

Submissions land in a tab named after the form (`general`, `healthcare`), created on first submit.

## Changing questions

Edit `dir-connect-26/forms.config.js` only. Question types are `select`, `multi`, and `text`. New fields
become new columns in the sheet automatically; no backend change is needed.

Changing `Code.gs` requires Deploy → Manage deployments → Edit → New version, which keeps the same URL.

## Local preview

    python3 -m http.server 8000

Then open <http://localhost:8000/?f=healthcare>.
