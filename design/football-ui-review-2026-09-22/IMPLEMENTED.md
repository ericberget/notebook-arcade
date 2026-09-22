# Implemented direction
September 22, 2026

The concept package is now carried into the football UI. Reenie Beanie remains the heading and player-name font; typewriter labels and values stay readable. Native SVG pen emblems, pencil fills, retraced player marks, small animations, and compact layouts provide the notebook character.

## Delivered
- Opening menu: shaded title, two primary modes, small Keeper League note.
- Quick Play: opposing club emblems and one game action.
- Club selection: eight distinct native SVG doodles, selection before commitment, one selected-club summary.
- Draft: three prospects on desktop, one on a phone; consistent attributes, selected card, one Draft action, compact five-pick strip. The first group contains the best overall available player and specialists chosen from existing attributes. Intermediate picks confirm inline with a short ring turn; the final squad receives the full reveal. Simulation keeps manual selections.
- Squad: five named starters in a sketched formation, record and last result, next opponent and Play action. Schedule and standings remain collapsed.
- Player cards: small O/X portrait, relevant attributes, three or fewer position-specific totals, optional scouting explanations, previous/next navigation. Irrelevant non-QB Arm Strength is hidden without changing gameplay attributes.
- Roster: five starters first, supporting players under Full roster.
- League: concise standings, next fixture emphasized, separate passing/rushing/receiving leaders.
- Real touchdown replay: bounded snapshots of actual season gameplay, including own interception returns, saved with the completed match. A real recorded-frame thumbnail opens playback with pause, replay and scrubbing. Older games are not reconstructed. No database or account service was added.
- Postgame: result, two player performances, a clear return to the squad and a replay link when available.
- Completed seasons: full completed save archived before a new season starts; prior results remain available under Past seasons.

## Season compatibility
New seasons use eight clubs, seven round-robin games, four playoff teams, a semifinal and the Bowl. Team IDs stay stable. Existing version-2 twelve-team saves continue their original eight-week regular season and sixty-pick draft. The old version-1 storage key is untouched. The current storage key accepts both version 2 and version 3, so users keep their existing season rather than receiving a reset.

## Validation
- All eight manual drafts, unique picks, snake order, per-pick reload, simulation preservation.
- Complete seasons for all eight teams, seven unique opponents, seeding, championship, elimination, duplicate-result protection and player statistics.
- Frozen twelve-team mid-draft and in-season fixtures complete under their original format; archives survive starting an eight-team season.
- QB and TE attribute behavior and compatibility checks.
- A complete game through the actual physics/game loop, with recorded touchdown snapshots, saved stats and duplicate-finish protection.
- Replay ownership, scoring attribution, non-scoring preservation, reset, bounded frame count and malformed-record rejection.
- Existing coach, contact and audio checks. The coach test harness now supplies the league helper loaded by the real page.
- Browser checks at 1280 × 720 and 390 × 844: selection, manual draft, reload, simulation, final reveal, squad, player modal, league, Quick Play, menu, replay controls, completion and archive flow. Phone draft action fits at 650 pixels with no horizontal overflow; QB card shows all four attributes and three totals. Browser console showed no errors.

The on-field simulation rules, controls and physics are unchanged. Replay hooks only copy coordinates. Motion honors reduced-motion preferences. Saves and replay storage remain local to the browser.
