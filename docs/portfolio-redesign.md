# Portfolio redesign — November 2026

A complete portfolio-only redesign: a large gradient name and human portrait, fixed glass navigation, responsive bento projects, AMBACAR timeline, secondary portrait, technology marquee, toolkit areas, credential cards, an animated Orbital invitation and a contact footer. All dedicated pages share the same typography, components and theme tokens. Concept artwork is explicitly identified as illustration, rather than product screenshots.

## Design and behavior

- Semantic light/dark tokens for backgrounds, surfaces, text, borders, accents, gradients, radii and shadows in `styles/portfolio.css`. The dark portrait halos stay luminous against dark clothing.
- Local Space Grotesk, Inter and JetBrains Mono with OFL licenses; consistent inline SVG interface icons in `tools/icons.mjs`.
- Both themes work on Home, Work, About, Toolkit, Contact, three project studies and 404.
- EN/ES links preserve the current page. Static English routes and equivalent `/es/` routes provide translated visible content, accessibility labels, placeholders, metadata and project notes. Source dictionaries: `content/translations/es.json` (normalized English keys), `content/translations/invariants.json` (explicit names/brands), `content/ui.json` (dynamic messages and phrases). The build fails for missing Spanish content; see `tools/i18n.mjs`.
- First-visit preferences follow browser language and OS theme. An inline head bootstrap avoids theme flash and applies remembered language. Explicit choices use `elkin-portfolio-language` and `elkin-portfolio-theme`. Theme changes also update `theme-color`.
- Native project dialog with keyboard dismissal and focus restoration; toolkit search and category filters; work filters; translated result counts and clipboard feedback.
- Counters, reveals, phrase rotation, marquee and orbital invitation respect `prefers-reduced-motion`. Images below the main portrait are lazy-loaded.

## Portraits and factual content

- Supplied blazer portrait: Home/About; tuxedo with brooch: Home biography; supplied round tuxedo: Contact/footer without a second crop; sweater: localized Open Graph covers.
- Four byte-identical PNG originals and eight WebP exports at 640/1133 px in `assets/profile/`. `tools/prepare-portraits.py` reproduces exports; `profile.portraits` describes them. Supplied facial appearance is preserved. Warm halos reduce the visibility of the original mild ear-edge fringe.
- `profile.photo`, its original JPEG and the CV PDF remain unchanged.
- AMBACAR: start 22 June 2026, completed mandatory 240 hours, Angular/C#/Oracle, five documented responsibilities. The end date remains unknown; no end date or ongoing employment is claimed.
- Home statistics come from the content: 240 internship hours, three featured projects, seven other projects, four credentials. No invented achievements, clients or results.

## Rebuild and audit

Edit templates, generator modules and content sources, then run:

```sh
npm run build:portfolio
npm run check
npm test
node tools/check-portfolio.mjs
```

To add a translation, add the normalized English key and its natural Spanish value to `content/translations/es.json`. UI messages require both locale entries. Technology brands may be explicitly invariant. For an inventory while authoring: `node tools/build-pages.mjs --portfolio-only --collect-i18n`; the report is in the workspace `outputs/portfolio-v3/missing-translations.json`. Finish with a strict normal build. Generated HTML and scripts/project-data*.js should never be edited manually.

## Verification

- Build, syntax checks and all 32 existing gameplay tests pass.
- Static audit covers 18 localized pages, one h1, unique IDs, image alternatives, preference bootstrap, and referenced local destinations/assets, including Open Graph covers.
- Browser screenshots cover nine routes × two languages × two themes × desktop/mobile (72 combinations). The matrix is saved in the workspace `outputs/portfolio-v3/browser-matrix.json`; screenshots live alongside it.
- Browser interactions reviewed: language/theme changes and persistence across routes, mobile menu and Escape, project notes and cycling in both languages, focus restoration, work filters, toolkit search/empty/reset/filter states, email copy feedback.
- Additional 320 px and tablet checks, lower Home/About sections and project component layouts are included in the final review. No document-level horizontal overflow or browser console errors were found.
- Protected-file SHA-256 comparison confirms all 28 protected files are unchanged and includes all game assets/scripts/pages, all shared/game CSS, the original CV photo and PDF. Orbital was not redesigned; its existing behavior remains covered by its 32 tests and unchanged files.

This is a local preview, not a deployment. Deployed-domain and physical-device checks remain part of publication.
