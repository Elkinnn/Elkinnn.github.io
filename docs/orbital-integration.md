# Orbital — portfolio integration, 14 November 2026

The user explicitly lifted the previous protection of /lab/. The [baseline audit](orbital-audit-2026-11-14.md) was completed and its findings shown before editing. This update integrates presentation, language, preferences and accessibility; the expedition and its difficulty are preserved.

## Design and navigation

Portfolio and Orbital load the same local Space Grotesk, Inter and JetBrains Mono faces and semantic light/dark tokens from styles/design-tokens.css. Portfolio layout stays in styles/portfolio.css; game overrides live in styles/orbital-integration.css. Header, entry, HUD, practice boards, dialogs, project dossiers and endings share those surfaces and controls. The light theme uses a twilight sky to preserve contrast around golden signals, rather than washing out the 3D scene. Canvas monitor/sign textures redraw on language/theme changes. The title, navigation and screen consistently say Orbital; the header has a visible Portfolio return link.

## Preferences and translation

Shared keys (identical to scripts/main.js): elkin-portfolio-theme = light/dark and elkin-portfolio-language = en/es. A stored choice wins. Without a theme choice Orbital starts dark; language follows the browser. Settings do not reload the game or modify its saved mission state. Return/case-study links follow the selected language. An ES/light game → Spanish/light portfolio → Orbital round trip preserved a partial expedition in the browser review.

Game-specific keys: elkin-orbital-reduced-motion = true/false; elkin-orbital-quality = auto/high/low. Motion follows prefers-reduced-motion initially and follows OS changes until explicitly overridden. Unavailable storage is safe. The portfolio's first-visit OS-theme behavior stays unchanged.

Edit English game copy in templates/lab.html or its source modules and Spanish copy in content/orbital-ui.json. tools/build-orbital-ui.mjs merges the shared project translations and emits scripts/lab/locale-data.js. Runtime localization preserves source strings, updates new HUD/dialog nodes, translates accessibility attributes, and redraws canvas signs. Named placeholders must match in both languages. Static translation coverage is checked during a full build and in tests; dynamic templates have regression examples. A missing runtime translation produces a console warning. Do not hand-edit generated HTML, locale-data.js or assets/lab/scene.js.

## Behavior and accessibility

- Systems text now distinguishes three relays, two barriers and the final terminal unlock. Recoverable expedition objects are consistently golden signals. Practice completion messages explain that they do not award expedition progress, including after a module has already been completed.
- Help has a translated accessible name and a visible desktop label. Touch arrows, camera drag/switch, jump, impulse, contextual interaction, fire and held scanning remain available. Actions have readable labels; mobile hints remain visible. Portrait HUD, toast and interaction controls are separated; short landscape panels can scroll.
- Reduced motion removes ambient turns/hovering, walking bob and camera smoothing. It does not change samples, hazards or mission timing. Scanner practice can use its separate step-by-step mode.
- Window blur or document visibility loss opens an explicit pause above the current dialog. Continue restores that dialog/focus. The active-time scanner clock freezes while away; input keys, pointer and scan latch are released. No automatic resume on focus.
- Renderer initialization/context failure and a 20-second loading timeout expose a friendly fallback with localized Work links and the standalone connection practice. Explore without 3D uses the same view and stops rendering. Retry reloads while retaining saved preferences and confirmed progress. Recovery handlers are installed before asynchronous renderer loading.
- Auto quality starts low on touch/small screens, otherwise high. A 120-frame average above 42 ms lowers auto resolution/shadows. Sustained averages above 100 ms show a low-quality/Work choice. Hidden/invalid long gaps are ignored. Explicit quality only affects pixel ratio/shadows. Slow-device behavior has deterministic unit coverage; no physical-device performance benchmark is claimed.
- AI briefing, practice and dossier explain that the game is a simplified demonstration and does not execute the project's recognition model.

## Gameplay preserved

No changes to mission ranges, rates, movement speeds, collisions, health, damage, checkpoints, rewards or assistance rules. Expedition, field and combat models/layouts are unchanged. The only gameplay.js change is the displayed name Signal → Golden signal; IDs, positions and saved keys remain identical. The original 32 gameplay tests remain in the suite.

## Validation and evidence

- Full build, npm run check, npm test (43 passing tests), npm run check:portfolio (18 localized pages / 590 local links and assets).
- Before editing: two complete expeditions, desktop 1440×900 and mobile viewport about 390×844. All golden signals, all sectors, all dossiers, Nexus, practices, pause/resume. See baseline audit for details.
- After integration: complete desktop EN and mobile-viewport ES expeditions, without mission assistance, through all three sectors and Network online. Ordinary map/mission guidance was used. Normal moving samples acquired with held scan; project dossiers consistent; final progress retained after reload.
- Three optional practices completed after integration, including Spanish completion feedback and unchanged earned progress. Invalid inputs and keyboard wiring were also reviewed in the baseline. On-screen forward movement, jump, impulse, drag look/camera, interaction, firing and held scanning were exercised with native pointer input.
- Actual browser focus loss tested using a temporary outer page/iframe: clicking outside the game produced its native window blur, showed the pause, and held the scanner at 20% across observations. Continue restored the same practice. This fixture was removed afterwards; it is not a production route.
- Initialization failure was injected by an isolated test server returning a throwing renderer module. The friendly ES fallback and Work link appeared; its connection practice worked without 3D. This tests the failure path, not actual GPU removal. Voluntary no-3D mode and retry were also exercised.
- Entry/HUD screens captured in both languages and themes; 320 px layout and 844×390 landscape checked for overflow. No console warnings/errors in the completed normal expedition runs. The deliberately injected renderer failure logs its expected diagnostic.
- Screenshots are outside the published repository in the workspace outputs/orbital-integration/. Final HUD matrix: 19–22 mobile and 25–28 desktop. Entry matrix: 01–04 desktop and 10–13 mobile. Additional evidence: 08/15 dossiers, 09/16 endings, 17 focus pause, 18 fallback, 23 mobile mission hint, 24 landscape. Screenshot 06 is an intermediate contrast experiment, not a final result.

The mobile review uses browser viewport and pointer controls; it is not a physical handset, Safari or simultaneous multitouch test. Real-device GPU, battery and multitouch behavior remain outside this environment's verification. No production deployment was performed for this update.
