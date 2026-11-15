# Elkin López — Portfolio & Orbital

Personal software engineering portfolio in English and Spanish. A blue, violet and rose identity, local typography, light/dark themes, optimized personal portraits, professional experience and shared project data across the collection and case studies.

## Current development step

The homepage introduces Elkin with his photograph, selected projects, professional internship, toolkit and learning credentials. It connects to dedicated Work, About, Toolkit and Contact pages. Three featured projects each have their own static page with context, individual contribution, a component study and source links. Work has area filters; Toolkit has search and category filters, including Oracle. About includes the complete AMBACAR experience, three official Cisco badge images and the public freeCodeCamp certificate link. Contact provides email copying and professional links.

The AMBACAR internship records a start date of 22 June 2026 and 240 completed hours, with Angular, C# and Oracle. An end date has not been invented. The English one-page CV is available from the header, home, About, Contact and footer. Its source profile is `content/profile.json`; `tools/build-cv.py` creates the PDF and copies the same file to the public download asset.

The homepage illustrations are original concept diagrams, not application screenshots. `/lab/` contains **Orbital**, a full-window space expedition built from original geometry: a robot explorer, connected floating decks, a ringed planet, recoverable signals, thruster impulses and three playable project-inspired sectors. Alert Courier combines a physical delivery route with review decisions; Relay Breach adds barriers, cover, energy shots and a patrol drone; Signal Hunt uses a handheld scanner to acquire moving samples. Each sector has checkpoints and optional assistance. The expedition goal is to recover three golden signals, restore all three modules and activate the central Nexus.

The previous portfolio repository is preserved. The personal site targets `https://elkinnn.github.io/`, using GitHub Pages from `main` / repository root. Build locally and include generated pages and the renderer bundle when publishing changes.

Orbital now shares the portfolio identity, EN/ES preferences and light/dark themes. The November 14 integration audit and regression review cover full desktop and mobile-viewport expeditions, all practice challenges, pause/resume, project dossiers and the Nexus. See `docs/orbital-audit-2026-11-14.md` for the audit performed before editing and `docs/orbital-integration.md` for the implementation, evidence and device-testing limits. `docs/orbital-review.md` records the earlier release.

## Preview locally

Use an active Node.js installation (Node 24 was used during development). Install the pinned dependencies, then start the preview:

```sh
npm ci
npm run dev
```

Open the Local URL printed by the preview server. The site itself is static HTML, CSS and JavaScript; Node.js builds the pages, bundles the game renderer and serves the local preview. Starting the preview generates the pages first. Three.js is pinned to 0.187.0 and esbuild to 0.28.2 in the lockfile. The 3D renderer is bundled locally and only imported on `/lab/`.

To regenerate pages after changing shared content or templates:

```sh
npm run build
```

For portfolio-only work while preserving Orbital and its generated page:

```sh
npm run build:portfolio
```

Local fonts and semantic theme variables live in `styles/design-tokens.css`, loaded by both experiences. `styles/portfolio.css` contains portfolio layouts; `styles/orbital-integration.css` adapts the game interface without changing its geometry or mission rules. Section renderers live in `tools/portfolio-sections.mjs`; concept visuals and project notes have separate templates.

### Themes and languages

Use **EN / ES** in the fixed header to change language and the sun/moon button to change theme. The first visit follows the browser language and operating-system color preference. Explicit choices persist under `elkin-portfolio-language` and `elkin-portfolio-theme`; unavailable storage is handled gracefully. A small inline head bootstrap applies preferences before the styles load. Spanish pages are static routes under `/es/`, including translated metadata, image alternatives and project notes. Orbital uses the same two preference keys without reloading the expedition. On an unconfigured first visit, its space scene defaults to dark; an explicit saved portfolio choice always wins. Return links follow the selected language.

To add or change copy, edit the English templates or content JSON and add its Spanish equivalent in `content/translations/es.json`. Keys normalize whitespace and decode HTML entities. Proper names and technology brands are explicitly listed in `content/translations/invariants.json`. Dynamic UI messages, plural forms and rotating phrases live in `content/ui.json`. `tools/i18n.mjs` produces both languages and fails the build when a translation is missing; the report is saved to the workspace `outputs/portfolio-v3/missing-translations.json`. During authoring only, `node tools/build-pages.mjs --portfolio-only --collect-i18n` collects new keys without stopping; a normal build must pass before delivery. Do not hand-edit generated HTML or project-data scripts.

The four supplied portraits have responsive 640/1133 px WebP variants under `assets/profile/`. The round portrait retains its supplied crop. `profile.portraits` describes them; `profile.photo` and the existing CV photo remain unchanged. Open Graph covers are localized 1200×630 JPEGs. `tools/prepare-portraits.py` reproduces the image exports with Pillow. Space Grotesk, Inter and JetBrains Mono are served from `assets/fonts/` with their OFL licenses, without a runtime font service. Animations respect reduced motion.

Run `node tools/check-portfolio.mjs` after a build to audit all 18 localized pages, headings and local links/assets. See `docs/portfolio-redesign.md` for the review scope.

Orbital copy is maintained in `content/orbital-ui.json`, merged with shared project translations by `tools/build-orbital-ui.mjs` during `npm run build`. It generates `scripts/lab/locale-data.js`; do not edit that generated module. Dynamic templates preserve their named placeholders. Strict builds and `tests/orbital-ui.test.mjs` reject missing static or signage translations. Runtime localization also covers live HUD updates and redraws canvas signage after a language change.

To regenerate the CV, run `python tools/build-cv.py` with ReportLab installed. The file is written to the workspace's `output/pdf/` directory and `assets/cv/`; the site build does not require Python. The original CV photograph is preserved without retouching; the new portfolio portraits do not change it.

```sh
npm run check
```

This checks JavaScript syntax. Interaction and responsive layout are checked in the browser during development.

```sh
npm test
```

The gameplay tests cover movement speed, collisions, magnetic deck boundaries, jumps, safe paths through all three sectors, port connections, quest progression, validated persistence, projectile combat, review decisions, interrupted transmissions, scanner range and line of sight, moving samples, pulse damage and checkpoint recovery.

## Orbital

- The game occupies the complete browser view. Its own fullscreen button also requests native fullscreen where supported.
- WASD / arrows: move. Shift: run. Space: jump. Q: a short thruster impulse, followed by a 1.6-second recharge. E: interact.
- Drag to look 360 degrees; V switches first/third person. The wheel adjusts distance or field of view. Touch screens have movement, jump and impulse buttons.
- Recover three golden signals by jumping near them. E near a signal also triggers the recovery jump. Signals are on reachable decks/walkways, and the flight plan updates after each recovery.
- Map offers optional automatic walking to every module, signal and the Nexus, plus direct entry to each sector. Third-person ground taps initiate walking in the orbital hub and Interfaces. Inside Systems, taps fire the blaster; in Applied AI, clicking a visible sample toggles tracking. Guide to next objective offers optional path navigation in every sector. Magnetic deck edges prevent leaving a walkway; there is no falling/death loop.
- Each station has one primary Enter / Resume / Replay action, saved-progress information and its assistance option. Optional practice exercises live inside Help, not in the station briefings. The map provides one set of direct mission entries without duplicate shortcuts.
- Interfaces / Alert Courier: collect the demo observation, carry it through the review pads, choose Needs follow-up for repeated absence and transmit it at the guardian uplink. Confirmed steps release physical barriers and save checkpoints. Stay beside the uplink during transmission; walking away interrupts it. Amber pulse crossings can be avoided by jumping, using Q or waiting for their inactive phase. Signal assist prevents interference damage.
- Systems / Relay Breach: enter the sector from the Systems module or Mission map. Shoot three amber relays to release two barriers, navigate around cargo cover and reach the final connection terminal. Fire with F (hold for repeat), a direct click on a target or the on-screen Fire button. Aim-assist brackets identify the current keyboard target. The blaster has a 5.5 m range and cannot shoot through crates or closed barriers.
- The patrol drone warns with a lock-on beam before firing at the captured position. Move, use cover, jump or Q to evade. Three hits disable the drone; defeating it is optional. Three shield hits return the explorer to the latest checkpoint, preserving activated relays. Shield assist prevents damage without disabling the encounter.
- Each of the first two relays saves a new checkpoint. Relay progress, defeated-drone state and completion survive reloads under `elkin-systems-sector:v1`; shields recharge when entering/resuming. Starting a replay resets the sector run while preserving earned expedition completion.
- At the final Systems terminal, connect Browser output → API input and API output → Database input. The field mission only completes after all three relays and both connections. Wiring-only practice is separately available and does not award the expedition module. Port order is reversible; duplicate edges do not add progress.
- Applied AI / Signal Hunt: calibrate the handheld scanner, acquire three moving holographic samples, then synchronize the final analysis uplink. Hold F or the on-screen SCAN button while a sample is visible within 4.5 m; cover blocks the scan and losing tracking reduces acquisition progress. Confirmed captures are kept. Noise crossings can be jumped or avoided, and three shield hits return the explorer to a checkpoint. Scan assist stabilizes samples, shortens acquisition time and prevents noise damage. This is a tracking game inspired by the project, not execution of its recognition model.
- Both field missions save confirmed progress under `elkin-field-interfaces:v1` and `elkin-field-ai:v1`. Resume restores the latest checkpoint; replay resets only that sector run and keeps its earned expedition module. Interfaces sequence practice and the AI timing-scanner practice remain available separately and do not award modules. Step-by-step scanner practice removes time pressure.
- An active Q impulse protects against the field missions’ pulse crossings; protection ends when the impulse ends. Completing Systems ends combat and holsters the blaster. Nearby 3D signs fade before they can obstruct the camera view.
- All three completed missions open the same project dossier, populated from `content/projects.json`: mission result, project context, architecture, my contribution, technologies, case study, repository and contribution history. Systems opens it after the final wiring connection; Interfaces and Applied AI open it after their uplink transmission. Closing the dossier leaves the explorer at the terminal, where E reopens it without restarting or granting progress again. Return to orbit leaves the sector.
- After three signals and three modules, return to the Nexus and press E to bring the network online. The central beam and completion panel confirm the result.
- Escape closes a panel or opens pause. Restart expedition clears this expedition's progress; replaying an individual challenge preserves its earned module completion.
- Validated progress is stored under `elkin-orbit:v1` when browser storage is available. A prior Systems completion is migrated on first use. An explicit restart is preserved rather than importing it again.
- Every project case study remains independently accessible in the regular portfolio. The mission map also provides direct challenge access without requiring movement.

The renderer uses WebGL 2. If initialization fails or its context is lost, the page offers a friendly explanation, the standalone Systems practice and localized Work links. Settings also offers Explore without 3D, which stops the render loop. Automatic quality starts conservatively on mobile and can reduce resolution/shadows on sustained slow frames; a persistently slow device receives a choice of low quality or project pages. High/Low can be selected explicitly; mission timers, damage, ranges and progression stay the same.

Reduced ambient motion follows `prefers-reduced-motion` unless explicitly saved under `elkin-orbital-reduced-motion`; graphics preference uses `elkin-orbital-quality`. The motion option removes ambient rotation, hovering, walking animation and camera smoothing without disabling movement. Step-by-step scanner practice has no time pressure. Window blur or a hidden document pauses the expedition; Continue restores the current dialog/practice and its frozen scanner phase. On-screen arrows, camera drag, jump, impulse, interaction and held scanning provide touch alternatives. Scene geometry, robot, planet textures, starfield and signage are original code-authored assets.

## Files

- `content/`: shared project descriptions, learning credentials, project collection and toolkit data.
- `templates/home.html`: editable homepage source.
- `tools/build-pages.mjs`: shared header/footer and dedicated-page templates; generates the homepage and section/project HTML files.
- `tools/build-lab.mjs`: bundles the Three.js scene into `assets/lab/scene.js` and preserves the Three.js license.
- `index.html`: generated semantic homepage and shared project dialog.
- `work/`, `about/`, `toolkit/`, `contact/`: generated, directly addressable static pages.
- `styles/main.css`: responsive layout, visual identity and reduced-motion support.
- `styles/pages.css`: dedicated page layouts, filters, case studies and learning cards.
- `templates/lab.html`, `styles/world.css`, `styles/lab.css`, `styles/orbital.css`, `styles/systems.css`, `styles/fields.css`, `styles/dossier.css`: full-window game interface, orbital identity, accessible mission panels and shared project dossiers.
- `scripts/lab/orbital.js`: perspective cameras, movement, impulse, recovery interaction and renderer lifecycle.
- `scripts/lab/orbital-world.js`: original orbital architecture, robot, planet, holographic modules and animation.
- `scripts/lab/expedition.js`: validated quest state, progression, alert sequence and scanner rules.
- `scripts/lab/systems-layout.js`, `systems-mission.js`, `systems-view.js`: shared sector geometry, deterministic projectile/combat rules, persistent checkpoints and 3D presentation.
- `scripts/lab/field-layout.js`, `field-model.js`, `field-view.js`: Alert Courier and Signal Hunt geometry, gated objectives, sustained acquisition/transmission, interference, checkpoints and 3D presentation.
- `scripts/lab/objects.js`: shared geometry and procedural screen textures.
- `scripts/lab/gameplay.js`: collision, A* pathfinding, puzzle rules and progress serialization.
- `scripts/lab/main.js`: game UI, modal interactions, focus pause, fallback, wiring display and persistence.
- `scripts/lab/runtime.js`, `localization.js`, `preferences.js`: shared preference keys, live localization, quality presets, active-time clock and slow-frame monitoring.
- `content/orbital-ui.json`, `tools/build-orbital-ui.mjs`, `tools/orbital-ui.mjs`: editable game translations, generated catalog, header/settings controls and strict coverage audit.
- `styles/design-tokens.css`, `styles/orbital-integration.css`: shared typography/theme palette and integrated game presentation.
- `tests/orbital-ui.test.mjs`: translation coverage, saved preferences, quality, motion and pause-clock regression tests.
- `tests/lab.test.mjs`, `tests/expedition.test.mjs`, `tests/systems.test.mjs`, `tests/fields.test.mjs`: movement, mission progression, combat, courier/scanner rules, safe routes and saved progress.
- `scripts/main.js`: mobile navigation, project content and modal interactions.
- `scripts/project-data.js`: generated homepage inspector data from `content/projects.json`.
- `assets/lab-illustration.svg`: original code-authored isometric workspace.
- `assets/icons/`: technology marks reused from the existing approved GitHub profile artwork.
- `assets/credentials/`: original badge images and their source references.
- `assets/lab/`: generated renderer bundle and third-party license. The orbital environment and character are code-authored geometry; no AI image assets or downloaded character models are used for gameplay.
- `tools/preview.mjs`: local preview server, bound to the loopback interface.

No CI deployment workflow is required for the current static Pages configuration. Run the full build and checks, commit the generated files with their sources, and push `main`. GitHub Pages then publishes the repository root.

## Editing and routing

Edit shared project facts in `content/projects.json`; the inspector and project pages are generated from that same content. Edit homepage presentation in `templates/home.html`. Edit section templates in `tools/build-pages.mjs`, then run the build. Keep generated HTML files in the repository for direct static hosting.

Routes have their own `index.html` files. Direct navigation and refreshing `/work/stayschool/`, for example, do not depend on a client-side router or server fallback. Root-relative links assume the agreed personal site at `elkinnn.github.io`, rather than a project site under a repository subpath.
