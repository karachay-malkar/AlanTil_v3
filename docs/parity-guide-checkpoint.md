# Guide and Learn checkpoint

Reference: Web 13.15.12 / 3249e0d3364656e1030d50791b24aaa8789ed1b8.
Input mobile: 4a91cd4a327c58cc915ab5f3b22fcec26431b33d.

## Changes
- Guide uses a same-window overlay and subtracts its measured origin from native target coordinates. No guessed status-bar adjustment.
- Minimum spotlight dimensions expand around the button center.
- Panel placement uses original Web candidate ordering, overlap penalties and card anchor, avoiding Undo/Favorite for all Learn phases.
- Closing/skipping immediately unmounts the guide, before persisting its completed flag.
- Learn header/system Back requests confirmation for an unfinished session. Stay preserves state; confirmation saves the snapshot before navigating. Uses the original localized message and Alan exit phrase.
- Card shadow moved off the two rotating faces onto their common rounded container. Inactive faces also explicitly fade out at the half-turn to prevent Android backface compositing artifacts.
- CI render script now walks all five Learn guide steps, checks the favorite spotlight center, guide removal and cancel/confirm exit.

## Evidence and limits
193 executable/source tests and eight source gates passed locally before commit. Actual build/render results must be checked for this commit; no Android device is attached. Gray-frame removal and hardware Back still need native acceptance, not just a browser image. Full Q03 remains open.

## Remaining work
| Area | Remaining acceptance |
|---|---|
| All screens | Paired visual comparison with exact Web reference, same data, locale, size |
| Guide | Native alignment at different safe-area sizes; all Path/Station help steps |
| Learn | Native flip/swipe/undo and frame cleanup; exact surface/colors |
| Test/Match | UI-level 20/40/80, directions, interrupted restoration, results |
| Account | Real Google callback, cold start, cancel, logout, restart |
| Progress | Offline, guest transfer, conflict/sync and no data loss |
| Content | Filled favorites, songs/audio, authenticated profile/statistics |
| Languages | RU/EN/TR, script/dialect and long-text S/M/L |
