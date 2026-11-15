# Orbital home cover

A real screenshot of this repository's Orbital renderer, captured locally on 14 November 2026. The robot, Nexus, decks, signals and planets come from the game; no synthetic illustration, retouching or downloaded model was used.

- cover-source.jpg: native browser capture (1440 × 1061), retained as the original.
- cover-640.webp: 640 × 472, approximately 33 KB.
- cover-1280.webp: 1280 × 943, approximately 83 KB.

The clean capture used a temporary page with only the existing LabScene canvas, awaited the local fonts, and applied dark/high quality/reduced ambient motion. The scene used its original arrival view and fresh expedition state, paused without a HUD. No game files, gameplay rules or personal saved expedition were modified. The temporary capture page was removed.

Run python tools/prepare-orbital-cover.py with Pillow to regenerate the two WebP variants from the retained source. Processing only resizes and encodes the capture; the screenshot's contents are preserved.

The homepage uses srcset/sizes, explicit dimensions, lazy loading and async decoding. Its 4:3 frame makes a small visual crop with object-fit:cover. The image link opens /lab/; the homepage does not initialize WebGL. Image alternative text and captions are translated in content/translations/es.json.
