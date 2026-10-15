# Third-party notices

- Mammoth: BSD-2-Clause.
- DOMPurify: Apache-2.0 OR MPL-2.0.
- PDF.js: Apache-2.0. Includes its distributed CMaps, fonts and WASM resources with bundled notices.
- Tesseract.js and Tesseract.js-core: Apache-2.0; core incorporates Tesseract, Leptonica and associated notices.
- English Tesseract trained data (`@tesseract.js-data/eng`): Apache-2.0.
- Vite and sharp: build dependencies; MIT/Apache-2.0 respectively. See installed dependency licences for transitive build tooling.

Production builds copy upstream licence files to `/licences/`. No remote CDNs are used at runtime. The software libraries perform conventional document parsing, OCR and media recording; no paid AI services are called.
