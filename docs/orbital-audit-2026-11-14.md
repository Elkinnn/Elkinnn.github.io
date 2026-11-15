# Orbital audit before integration

Baseline: commit 51dbd18, clean working tree. Source files were unchanged throughout the audit. Static copies were served on isolated loopback origins 4175 (desktop) and 4176 (mobile), preserving the user's usual preview saves. Evidence: workspace outputs/orbital-audit/01–10 JPEGs.

## Played, not simulated through internal state

Both runs: launched a fresh expedition; completed alert-sequence, connection and timing-scanner practices; verified practices granted no mission progress; recovered three golden signals through ordinary map guidance and recovery jumps; completed Alert Courier, Relay Breach and Signal Hunt without mission assistance; opened all three project dossiers; activated Nexus and reached Network online. Existing map/mission guidance was used. Practice scanner step mode followed the system reduced-motion preference. Desktop also verified the Nexus was locked before modules were restored, invalid practice input, keyboard wiring, completed Systems combat state and saved completion after reload. Mobile used on-screen movement, jump, impulse, camera drag/switch, interaction, firing and held scanning, pause/resume and the final screen.

Desktop 1440×900; mobile viewport 390×844 with native pointer input. Not a physical handset or a multitouch/Safari/GPU benchmark. Check and all 32 gameplay tests passed before editing. No console warnings/errors and no progression blockers were found in either completed run.

## Findings shown to the user before corrections

1. Game typography, palette and components are separate from the portfolio; there are no shared theme/language controls.
2. Browser title says Play the Lab; screen says ELKIN / ORBITAL. Use Orbital consistently.
3. Three relays and two barriers exist; briefing and relay activation messages incorrectly imply one barrier per relay.
4. Signal terminology alternates between signals and golden signals.
5. Mobile actions work, but keyboard labels Q/FIRE/F and hidden aiming instructions make them less clear. The portfolio exit is an arrow without a visible text label on mobile.
6. The ? button already has an accessible English name (Open controls); add a visible label and translation rather than claiming it was unnamed.
7. Blur only releases keys; hidden documents skip 3D frames but no explicit pause/resume state is shown. The timing practice uses elapsed wall time, so absence can advance its phase.
8. Reduced motion is read initially; there is no user control. A WebGL fallback already exists, but there are no quality controls or slow-device recovery prompts.

The AI demo clarification already exists in English briefing/practice; make it concise, translated and easy to find. WebGL failure was source-reviewed, not induced during this baseline audit. No source modification was made until this report and the user-facing finding list were complete.
