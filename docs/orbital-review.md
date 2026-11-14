# Orbital — first release review

Reviewed locally on 2026-11-14. Status: ready for the portfolio's first game release. No additional gameplay feature is required for the agreed scope. Publication remains a separate portfolio phase.

## Changes from the review

- Removed practice actions from all station briefings; kept the three optional exercises under Help.
- Removed the map's duplicate direct-mission shortcuts.
- Cleared Systems-specific presentation when switching directly to a field mission.
- Made active thruster impulses protect against pulse interference as described in the instructions.
- Ended combat and holstered the blaster after Systems completion.
- Faded signs close to the camera after observing a calibration sign obstructing the mobile view.
- Applied the dark native-control theme throughout the game and synchronized focus when closing panels.

## Verification

- Build and JavaScript syntax checks passed; 32 gameplay tests passed.
- Checked 59 local HTML destinations with no missing files.
- Played a fresh expedition on a separate preview origin, preserving the existing user preview's progress.
- Completed all three practice exercises; confirmed they awarded zero mission progress.
- Recovered all three signals through map navigation and recovery jumps.
- Confirmed that the Nexus stays locked while project modules are missing.
- Completed Alert Courier, Relay Breach and Signal Hunt and opened their respective project dossiers.
- Left and reloaded a partial field mission, resumed its saved checkpoint and finished it.
- Verified direct Systems-to-AI switching, final-terminal interaction and the completed Systems combat state.
- Reached Network online, reloaded and confirmed that completion persisted.
- Restarted the completed expedition and reloaded; confirmed zero signals and zero modules, without re-importing the old Systems completion.
- Checked keyboard movement, jump, impulse, camera switching, pause/resume, native fullscreen entry/exit, and map guidance.
- Checked mobile movement, jump, impulse, held-scanner input, 390 × 844 layout and the project dossier at 320 × 740 without horizontal overflow.
- No warnings or errors appeared in the browser console during the final browser run.

## Verification limits and release follow-up

The mobile checks used browser viewport emulation with native pointer input, not physical handset hardware. Device-specific GPU performance and Safari were not benchmarked. The WebGL-unavailable fallback was reviewed in source; a real GPU/context failure was not induced during this review.

Before sharing the public portfolio, deploy it to the agreed GitHub Pages destination and smoke-test that deployed URL on a desktop and a physical phone. These are publication checks; the game does not need more missions, enemies, scoring or other mechanics to fulfill its current purpose.
