# Contact form + free resource downloads → Google Sheets & Gmail (no server required)

The site is fully static (GitHub Pages), so instead of a backend, both
of its forms submit straight to a **Google Apps Script Web App** —
Google hosts and runs this for free. One script/deployment handles two
things:

1. The **"Connect With Us" contact form** → appends a row to a
   `Submissions` tab in your Google Sheet.
2. The **"Download for Free" popup** on each resource card → appends a
   row to a `Downloads` tab, *and* emails the requester a PDF of the
   guide they asked for.

There's nothing to host, scale, or pay for.

## How it works

1. Someone submits either form on the site.
2. `js/contact-form.js` (contact form) or `js/resource-download.js`
   (download popup) POSTs the form fields to the same Apps Script URL,
   configured once in `js/config.js`. A hidden `formType` field
   (`contact` or `download`) tells the script which one it is.
3. The Apps Script project, running on Google's infrastructure, either
   logs the contact submission, or logs the download request **and**
   emails a PDF attachment to the address they gave.

This repo's `apps-script/` folder mirrors one Apps Script **project**
made up of four files — Apps Script compiles every `.gs` file in a
project into one shared scope, so the three code files are split purely
for readability, not separate scripts or deployments (the manifest is
the one file that's structurally different — see below):

- **`Code.gs`** — the router (`doPost`/`doGet`) plus small helpers both
  forms share. Start here to see how a submission gets dispatched.
- **`Contact.gs`** — everything for the "Connect With Us" form.
- **`Downloads.gs`** — everything for the free-resource popup: the
  resource library, PDF generation/lookup, and the email send.
- **`appsscript.json`** — the project manifest. Declares every OAuth
  scope the project needs up front, so the one-time authorization is a
  single screen covering everything instead of a prompt appearing again
  later as new code gets added. This does *not* remove the need to
  click through that authorization once — no config file can skip
  Google's consent requirement — it just collapses it to one screen
  instead of several over time.

  | Scope | Why it's needed |
  |---|---|
  | `spreadsheets` | Reading/writing the `Submissions` and `Downloads` tabs |
  | `drive` | Exporting the temp Doc as a PDF, trashing it, and reading a real uploaded PDF by file ID |
  | `documents` | `DocumentApp.create()` — building the temp placeholder Doc in the first place |
  | `script.send_mail` | `MailApp.sendEmail` — the narrow "send mail as you" scope, not full Gmail access |

  **Important:** once `oauthScopes` is present at all, Apps Script stops
  auto-detecting scopes from your code and uses *only* what's listed
  here. If you add code that calls a new Google service, you must add
  its scope to this list yourself — otherwise it fails immediately with
  `Specified permissions are not sufficient to call X` instead of
  prompting for authorization, because as far as Apps Script is
  concerned that scope was never requested at all.

## One-time setup

1. **Create a Google Sheet.** Go to [sheets.google.com](https://sheets.google.com),
   create a new sheet, and name it something like "Visa Planner Online — Form Submissions".

2. **Open the script editor.** In the Sheet, go to
   `Extensions -> Apps Script`. A new tab opens with a blank project
   containing one empty `Code.gs`.

3. **Show the manifest file.** Click the gear icon (**Project Settings**)
   in the left sidebar and check **"Show 'appsscript.json' manifest file
   in editor"**. Go back to the editor (the `<>` icon) — you'll now see
   `appsscript.json` listed alongside `Code.gs`.

4. **Create the four files.** Paste the contents of this repo's
   [`apps-script/Code.gs`](Code.gs) into the project's existing
   `Code.gs`. For the next two, click the **+** next to "Files" in the
   left sidebar → **Script**, name it `Contact` (Apps Script adds the
   `.gs` itself), and paste in [`apps-script/Contact.gs`](Contact.gs).
   Repeat once more for a file named `Downloads`, pasting in
   [`apps-script/Downloads.gs`](Downloads.gs). Finally, open the
   `appsscript.json` you just revealed, delete its contents, and paste
   in this repo's [`apps-script/appsscript.json`](appsscript.json).
   Save (Ctrl/Cmd+S) —
   the `.gs` file names must match exactly, but as noted above that's
   only for your own readability; Apps Script doesn't care which file a
   function lives in. The manifest, on the other hand, is read by name
   (`appsscript.json`) — that one's not optional.

5. **Run it once inside the editor first.** Even with the manifest
   declaring the scopes up front, Google still requires one interactive
   consent. Select the `doGet` function in the toolbar dropdown and
   click **Run**. A permissions screen will list Sheets, Drive, and
   send-mail access all at once — click through "Advanced -> Go to
   project (unsafe)" if it appears (that warning just means Google
   hasn't manually reviewed your personal script, which is normal) and
   **Allow**. Doing this now avoids a silent failure on someone's first
   real download request.

6. **Deploy it as a Web App.**
   - Click **Deploy -> New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - Confirm (or set, if not already pre-filled from the manifest):
     - **Execute as:** Me (your account)
     - **Who has access:** Anyone
   - Click **Deploy**, and authorize again if prompted.

7. **Copy the Web App URL.** After deploying, you'll get a URL that
   ends in `/exec` — something like:
   `https://script.google.com/macros/s/AKfycb.../exec`

8. **Paste that URL into the site.** Open [`js/config.js`](../js/config.js)
   and set:
   ```js
   window.VPO_APPS_SCRIPT_URL = "https://script.google.com/macros/s/.../exec";
   ```
   Commit and push. Both forms read from this one constant.

## Sending the real guides instead of placeholder PDFs

Out of the box, every "Download for Free" click emails an
**auto-generated placeholder PDF** (just a title + a note) — this lets
you test the entire flow (popup → email → attachment) before you have
real guides written. To swap in the real thing:

1. Write/export your guide as a PDF and upload it to Google Drive.
2. Open it in Drive, click **Share** and set it so anyone with the
   link can view (the script reads the file as *you*, but this is the
   simplest way to avoid permission surprises).
3. Copy the file ID out of the URL: `.../d/`**`THIS_PART`**`/view`.
4. In `Downloads.gs`, find that resource's entry in `RESOURCE_LIBRARY`
   and paste the ID into `driveFileId`:
   ```js
   "f1-visa-guide": {
     title: "F-1 Visa Interview Preparation Guide",
     driveFileId: "1AbCdEfGhIjKlMnOpQrStUvWxYz",
   },
   ```
5. Save, then **redeploy** (see below) so the change goes live.

The five slugs already wired up (must match the `data-resource`
attribute on each button in `index.html`): `f1-visa-guide`,
`usa-arrival-checklist`, `uk-arrival-checklist`,
`canada-arrival-guide`, `general-document-checklist`.

## Updating the script later

If you ever edit any of the files again (new field, new resource,
swapping in a real PDF, a new scope in the manifest, etc.), you need to
**re-deploy** for the change to take effect: `Deploy -> Manage
deployments -> edit (pencil icon) -> New version -> Deploy`. Editing
the code alone does not update the live `/exec` URL — check that
`CODE_VERSION` in `Code.gs` matches what your deployed `/exec` URL
reports via `doGet` (just open the URL in a browser) to confirm a
redeploy actually took. If the edit added a new Google service
(Drive/Docs/Gmail/etc.) or a new scope you haven't used before, re-run
step 5 above first so the new permission gets granted.

**Already have an older version deployed?** Whether that's the very
first single-file `Code.gs`, or the three-file split without the
manifest — your existing project still works as-is; both the split and
the manifest are optional, additive changes. To adopt either: open your
existing project, update the file(s) in question (add `Contact.gs`/
`Downloads.gs`, and/or reveal + paste in `appsscript.json` per step 3
above), save, then create a new deployment version. The `/exec` URL
stays the same throughout.

## Good to know / limitations

- **No response confirmation.** Google Apps Script web apps don't send
  CORS headers, so the browser can't read the response back — the
  front-end sends the request with `mode: "no-cors"` and just assumes
  success if the network request didn't fail outright. This means a
  server-side error (a bad Drive file ID, a Gmail quota being hit)
  would still show a friendly "success" message to the user. `Code.gs`
  writes any email failure into the `Downloads` sheet itself (in the
  resource-slug column) so it's not completely invisible — worth
  glancing at that sheet occasionally, and doing one real test
  submission per resource after setup.
- **Gmail sending quota.** `MailApp.sendEmail` shares Gmail's daily
  sending quota: **100 emails/day** on a plain personal Gmail account,
  **1,500/day** on Google Workspace. Fine for a small consulting site's
  download requests, but worth knowing if a resource ever goes viral.
- **Free Apps Script quota.** Separately, Apps Script itself allows a
  generous 20,000 URL Fetch/web app requests per day on a personal
  account — not the limiting factor here, Gmail's quota is.
- **Spam.** Since the endpoint is public (`Anyone` access), anyone who
  discovers the URL could POST to it directly, bypassing the site —
  which for the download form means someone could burn through your
  daily email quota by scripting requests. For a low-traffic consulting
  site this is a minor risk, but options if it becomes one: a honeypot
  field, Google reCAPTCHA, or a shared-secret field checked in `Code.gs`.
- **Not a real database.** Fine for collecting leads/enquiries, but a
  Sheet isn't built for high volume or complex querying. If the
  business outgrows it, the same static-site approach works with a
  proper backend (e.g. a small serverless function on Cloudflare
  Workers/Vercel/Netlify) without changing anything else about how the
  site is hosted.
