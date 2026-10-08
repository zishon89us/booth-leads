# Lead capture forms

Two short lead-capture forms and a booth scanning app, served as static pages and writing to a Google Sheet.

- Assessment (general): `/assessment/`
- Healthcare: `/healthcare/`
- Booth app: `/booth/`

The form pages are not tied to one event. Add tracking tags to a link or QR code to see where
responses came from, for example `/assessment/?utm_source=dir-connect`. `utm_source`,
`utm_medium`, `utm_campaign`, `utm_content` and `utm_term` are saved as columns with each response.

Shared code lives in `app.js`, `app.css` and `forms.config.js`; each page is a small shell.
`dir-connect-26/` and the root `index.html` only redirect older links.

## Booth staff mode

Open `/booth/` on your own phone or tablet. It must be served over https for the camera to work.

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

## Emailing documents from the booth app

List PDFs under `email.documents` in `forms.config.js` and put the files in `docs/`. The booth
app then shows an "Email these documents" section. Ticking documents and tapping **Save lead**
saves the lead and opens the phone's own mail app with the recipient, subject and message filled
in, so the email goes from whoever is holding the phone. The documents go in as links, because a
`mailto:` link cannot attach files. Edit the wording under `email.subject` and `email.body`.

## Setup

1. **Sheet + backend**
   - Create a Google Sheet, then Extensions → Apps Script.
   - Replace the editor contents with `apps-script/Code.gs`.
   - Deploy → New deployment → Web app. Execute as: **Me**. Who has access: **Anyone**.
   - Copy the web app URL (ends in `/exec`) into `endpoint` in `forms.config.js`.
2. **Host** the whole folder on any static host (Netlify, Cloudflare Pages, GitHub Pages, S3).
3. **QR codes**: `./make-qr.sh https://<your-host> "utm_source=<event>"` writes PNG and SVG files to `qr/`.

Submissions land in a tab named after the form (`general`, `healthcare`), created on first submit.

## Publishing changes

Run `./publish.sh "what changed"`. It stamps the pages with a new version number, commits and
pushes. The host tells browsers to keep files for 10 minutes, so a page that was opened recently
can show the old version until it is reloaded after that time.

## Changing questions

Edit `forms.config.js` only. Question types are `select`, `multi`, and `text`. New fields
become new columns in the sheet automatically; no backend change is needed.

Changing `Code.gs` requires Deploy → Manage deployments → Edit → New version, which keeps the same URL.

## Local preview

    python3 -m http.server 8000

Then open <http://localhost:8000/healthcare/>.
