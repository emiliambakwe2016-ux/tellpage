# TellPage verification — 15 October 2026

## Verified locally in Chromium 153

The real application was exercised through Playwright, rather than checking only visible buttons. Passed: editing and bold formatting; IndexedDB save/reload/reopen; virtual-microphone MediaRecorder start/pause/resume/stop/preview; multiple passage recordings and a separate whole-document introduction; correct passage navigation; survival of unrelated document edits; editable backup and restore; actual downloaded self-contained HTML opened from `file://` with offline playback and no HTTP requests; recipient preview; real DOCX heading/bold/table import plus voice annotation; two-page selectable-text PDF import, page navigation and zoom; scanned PDF manual region recording; local English OCR; responsive checks at 320, 390, 768 and 1440 pixels; dangerous markup/URLs and malformed backup rejection.

A separate production build test passed with the deployed Content Security Policy: service worker preparation, offline reload, reopening a saved local project, offline PDF import, reader preview and offline English OCR. No external runtime asset host is necessary.

## Limits of evidence

No physical Android phone, iPhone or microphone was available. A mobile viewport verifies layout, not a phone's file manager, attachment handling or microphone. Recording API tests used a virtual microphone. Publicly recorded human speech was separately embedded and played from an exported document. WhatsApp transmission, native share completion, email provider acceptance, Safari, Firefox and physical PWA installation are unverified. Some recipients/services cannot open or accept HTML attachments. Browser audio codec support varies.

PDF exports use rendered page images and an overlay, retaining visual layout; the original PDF remains in the editable backup. English OCR is approximate. Word conversion is not pixel-perfect. Storage quota/error handling does not make browser storage permanent. Keep project backups.

A proportionate preliminary web search did not identify an obvious TellPage document/voice software conflict; this is not a formal trademark search or legal clearance.

Five product addresses on the About page were verified against their existing Cloudflare domain bindings (Reveal Right: active Pages domain). Public page fetches from the local environment were network-restricted. Reveal Right is described generically instead of assigning unverified features.

## Final interaction and deployment checks

Additional browser tests passed undo/redo, replacing a recording without duplicating it, changed-passage warnings, reattaching audio and deleting an annotation while preserving the document. Storage-quota failure and microphone-denial feedback were exercised. A focus-related reattachment defect found by this check was corrected and retested before the final release.

Cloudflare Pages production deployment and `tellpage.startright.ng` domain/HTTPS activation were confirmed through the connected API. The permanent HTTPS URL was also opened in the cloud browser and displayed the real Create workspace, three primary navigation menus, editor and recording controls without a sign-in wall. Production files are uploaded as static assets only. Created resources: one Pages project (`tellpage`), its custom domain and one CNAME record. No D1, KV or R2 resource was created.

## Correction and purple redesign release

Replaced fixed-edge text controls with content-free, non-editable inline buttons at exact text-range ends. Controls are removed by sanitisation from saved editable HTML; text quotes, audio IDs, browser database version and backup version stay compatible. PDF selections now store exact quote offsets plus separate normalised line rectangles. Text runs are fitted to their PDF widths; highlights are recomputed from text anchors on resize/zoom. Legacy PDF regions with an unambiguous quote are resolved non-destructively for display. PDF playback uses a dedicated play action; only Go to passage navigates. Margin controls have opaque purple styling and touch-sized targets.

The rich purple identity covers light/dark UI, icons and controls. Authoring text is larger with wider reading space; imported document colours and PDF page images are not recoloured. Mobile toolbars scroll on one row, recordings open in a dismissible viewport panel, and introduction recording has a direct mobile control. Visual-viewport handling repositions notices above the keyboard/navigation. Recording opens with Record focused and restores the reading scroll position on close. Autosave remains always active and is explained in Settings.

Export now shows only the filename, size, recording count and actions under “Your document is ready”. Download initiation closes the dialogue and is not misreported as a completed browser download. Exported reader attribution is “Created with TellPage”. Embedded offline playback remains functional.

Offline root cause: the original cache list included `_headers`, a Pages configuration file that is not published as an asset. The original local server served this file, so the first offline test did not reproduce the Pages condition. Tests now explicitly return 404 for it. The new worker excludes configuration files, caches an explicit index shell, handles navigation independently of network access, reports per-asset preparation, verifies cached completeness and supports activation of a prepared update. It never changes or deletes IndexedDB projects. One previous asset-cache version remains available for already-open windows.

Passed in Chromium 153: the full existing 16-group regression suite and undo/redo/replacement/reattachment/deletion checks; inline marker placement and clean saved HTML; compact export/automatic closing/independent offline reader; real wrapped multi-line PDF selections excluding trailing words; precise persisted line geometry at 320, 390, 768 and 1365 px and 150% zoom; page-margin button placement; playback without scroll changes; purple light/dark settings and visible confirmations; a one-row mobile toolbar and dismissible recording panel; touch-enabled mobile recording scroll restoration; reduced-viewport typing with the caret visible. These tests are automated, not physical Android keyboard tests.

Passed under the production CSP with `_headers` unavailable: prepare online, record/save, disable the network, refresh, reopen and play stored audio, import PDF offline and run local English OCR. Additional tests upgraded a legacy worker in an existing browser context, activated/control-checked the new worker, refreshed offline and confirmed unchanged project IDs. A deliberately failed OCR-asset download produced a persistent failure without claiming success; retry then succeeded. All microphone capture in this environment uses a virtual test device. Physical Android, Windows Edge hardware and third-party attachment delivery still require separate real-device evidence.
