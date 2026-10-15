# TellPage

Give your documents a voice.

A local-first, account-free Progressive Web App owned by StartRight NG Business Ventures and developed for Adaeze Emilia Mbakwe. Production: https://tellpage.startright.ng

## Architecture

Vanilla JavaScript modules, Vite, IndexedDB, MediaRecorder, Mammoth, PDF.js and Tesseract.js. Static Cloudflare Pages hosting only. No document-processing backend, paid AI, telemetry, registration, document database or audio storage. Every production dependency and OCR model is served from the same origin. User documents, page images, original PDFs, audio and project metadata stay in browser memory/IndexedDB until the user downloads or shares a file.

## Build

Node.js 22.12+ (tested on 24). Run `npm ci`, then `npm run build`. The resulting `dist` directory includes application code, PDF resources, OCR workers/cores/English model, licences, PWA icons, manifest and versioned service worker. Deploy `dist` to the independent Cloudflare Pages project `tellpage`. `_headers` contains the production security policy. No environment variables are needed by the application. `npm run dev` starts development on 127.0.0.1.

## Portable files

The recipient document is a single `.html` file with a controlled reader, embedded images, text and data-URL audio. Its restrictive CSP prohibits remote connections. It does not depend on TellPage being available. An editable `.tellpage` JSON backup additionally contains authoring data and the original PDF where applicable. Imported backups are validated and document HTML is sanitised.

HTML attachments are not universally supported by messaging or email previews. Recipients generally need to save the file and open it in a compatible browser. Some services block HTML attachments. Physical Android/iPhone file-opening, WhatsApp delivery and email-provider acceptance are unverified. No cross-platform or trademark-clearance guarantee is made. Playback depends on the audio codec negotiated by the recording browser.

PDFs retain their original file in the editable project; the workspace and reader use local rendered page images with a selectable text overlay and relative annotation coordinates. This preserves visual layout, not editable PDF semantics, vector zoom quality or the full original PDF accessibility tree. English OCR runs on demand locally; manual region annotations are independent of OCR. Word conversion preserves basic structure but not every Word layout feature. Limits: 25 MB Word/PDF, 60 PDF pages, 10 minutes per recording, 150 MB interactive export. Audio quality requests 64/128 kbit/s where supported; browsers may choose a different actual bitrate.

## Anchoring and saving

Text annotations use persistent block IDs, exact quotes and surrounding context; ambiguous or missing targets remain in the recording index and can be reattached. Editing never deletes audio automatically. PDF annotations use page numbers and normalised coordinates. IndexedDB writes complete atomically and are serialised; visible quota errors preserve the in-memory document and backup controls. Backups are necessary because browser storage can be cleared and does not sync.

## Tests

`node tests/fixtures.mjs` creates real DOCX/PDF/scanned-PDF fixtures. `npm test` runs browser interaction tests; `node tests/production.mjs` verifies production CSP, offline caching, reopening, PDF import and OCR. Install a Playwright Chromium browser or supply `CHROME_BIN`. Tests use a virtual microphone and must not be represented as physical microphone verification. The independent portable export gate also tested embedded public-domain human speech (Dvortygirl, “hello”, Wikimedia Commons), not physical microphone capture.

Verification covers creation, formatting, local saving/reopening, multiple/whole-document recordings, recording pause/resume/preview, index navigation, unrelated text editing, backup/restore, recipient export and independent offline playback, real Word/PDF imports, scanned-region attachment, English OCR, 320–1440px layouts, imported-content sanitisation, malformed backup rejection and production offline operation. See `VERIFICATION.md` for final results and limitations.

## Licences

Application source: copyright 2026 StartRight NG Business Ventures. All rights reserved. Third-party components retain their own licences, reproduced under `dist/licences` and listed in `THIRD_PARTY.md`. No test recordings are included in production.

## Purple correction release

The existing browser database and `.tellpage` backup version remain unchanged. New PDF text anchors add optional exact offsets and separate line rectangles; older regions still open. Inline voice controls contain no document text and are excluded from saved HTML. Interface themes never recolour the PDF image or apply brand colours to document paragraphs.

`npm run test:corrections` checks the reported annotation/export/mobile defects. `npm run test:offline` checks the production-style unavailable `_headers` condition, saved-audio offline reopening, a legacy worker update and failed-download retry. Run a production build first. Test microphones and mobile keyboards are virtual/emulated, not physical-device verification.

Autosave is always on. Offline preparation provides persistent progress beside the Settings button and confirms readiness only after cache verification and worker control. A previously open TellPage window can retain its previous app version until it is closed and reopened; saved work must not be cleared to update.

## Returning-session repair

Pages redirects `/index.html` to `/`. The worker requests the canonical shell and normalises redirected responses before satisfying navigation; returning sessions must not reuse a followed-redirect Response for a manual-redirect navigation. Tests now reproduce this real hosting behaviour and the previous `ERR_FAILED` failure. A completed essential install activates automatically without reloading open editors; previous asset caches and IndexedDB content are retained. Offline readiness is rechecked when the controlling worker changes. Cache failures cannot cancel successful network responses.

`npm run test:reliability` reproduces the a090816 failure, upgrades that broken worker through navigation, checks repeated/offline access, fault handling and renderer reinitialisation, then verifies grammar and a persistent-profile browser restart. Run `npm test` first to generate the saved-audio fixtures and build production files before reliability/offline tests. The legacy worker fixture keeps its original logic; the test substitutes only current asset paths. Physical Android/Internet Browser behaviour remains a separate device check. Never clear site data as an update or recovery step.
