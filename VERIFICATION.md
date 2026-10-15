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
