# Football UI design review
September 22, 2026 · Notebook Arcade

## Recommendation
Build the surrounding experience around **eight memorable clubs and five players you know by name**. Keep the existing on-field game, the notebook paper, the pen-drawn Xs and Os, the funny names, and the shaded title banner. Concentrate the next design pass on hierarchy, comparison, and attachment to the squad.

This is a design review and concept package. No live UI, league size, saved season, or gameplay was changed. The generated images are visual direction, not implemented screens. Example names, values and the club shortlist are illustrative; the replay panel is a proposed feature.

## Review basis
Reviewed the current local football UI corresponding to source revision `67c3794fcfcfd030f29ed9fcf1992a8077b71c99`, including desktop menu, Quick Play, club selection, season hub, draft and scouting modal. Inspected draft, squad and player-card layouts at 390 × 844, and desktop layouts at 1280 × 720. Used an isolated draft preview so existing saved seasons were untouched. Reviewed roster, standings, leaderboards, reveal, season-completion and result handoff behavior in the source; this was not an exhaustive playthrough of every postseason state. The on-field game is outside the redesign scope.

## What is already worth keeping
- The shaded title banner now has a clear role above the menu.
- Reenie Beanie works for names and short headings; typewriter text works for labels and numbers.
- Retraced O portraits and scratch-filled attribute meters establish the right material.
- The squad formation is a much stronger season centerpiece than the earlier standings dashboard.
- Position-specific season statistics are the right level of detail.
- Collapsed standings and schedule already respect the request for less text.
- Funny names supply personality without needing paragraphs of jokes.

## Fix first

### 1. Shrink the repeated header
The desktop masthead and navigation occupy roughly the first 200 pixels before the task begins. On a phone, the league title wraps, and navigation becomes a horizontally clipped strip. The player is repeatedly seeing the brand and global navigation while trying to draft or start the next game.

Use a compact inner-page header with a small logo, current context, and at most two relevant destinations. Keep the larger logo treatment on the opening menu. In a season, use Squad and League, with Quick Play and other modes under the game menu. On small screens, use a visible back label and compact context instead of a sideways navigation strip.

### 2. Make drafting a comparison, not a catalog
The current first draft screen has a title, Sim button, five-slot progress strip, instruction line, four prospect cards, pagination, and a separate squad diagram. At 390 × 844, the first prospect begins around 550 pixels down. At desktop height 720, even the first pair of Draft buttons approach the bottom edge.

Show three prospects per desktop view, with the same attribute order and scale. Let the user select a card, then use one primary “Draft [name]” button. Keep More prospects as an optional link. A tiny five-slot strip is enough to show the team coming together; save the full formation for the reveal and season hub.

On mobile, show one full prospect card at a time with explicit previous/next controls and a pinned Draft button. Keep progress in one compact row. Allow detailed scouting by tap; do not require opening a modal to compare the main ratings.

The labels “Big arm,” “Team captain,” and “Scrambler” in the concept summarize existing ratings. They should be derived from attributes, not imply an additional hidden ability system. Include lower-rated alternatives with different strengths so highest OVR is not always the obvious answer.

### 3. Keep player cards within one screen
The current portrait stretches down the entire height of the attribute column. On mobile that becomes a tall, mostly empty box, while the season statistics fall below the fold. Attribute explanation paragraphs dominate the narrow column.

Use a small fixed-ratio O portrait beside the name and number, then full-width attribute rows below. Keep the values visible; move explanations into accessible tap/click disclosures. Keep the three relevant season statistics together at the bottom. Add previous/next-player controls so browsing the five starters does not require repeatedly closing and reopening cards.

WRs still expose Arm Strength and a quarterback-specific explanation. Remove that irrelevant rating from WR scouting; Speed, Hands and Power are enough for now. Do not invent a fourth stat until it has a clear effect in play. Preserve the already requested QB and TE attribute sets.

### 4. Give eight clubs stronger identities
Twelve teams currently produce a lot of similar bordered tiles, color combinations and motto text. Several badges are generic symbols whose relationship to the club is weak. More clubs are not yet producing more meaningful choices.

Recommend **8 clubs, 7 regular-season games, top 4 into semifinals and the Notebook Bowl**. Every team plays every other team once. This keeps enough opponents and variety while making rivalries and the table easy to remember. Six clubs would be a defensible smaller arcade league, but eight is the better starting point for the expansive feeling you want.

Use a 4 × 2 badge selection on desktop and 2 × 4 on mobile. Show only the emblem and short club name until selected. Selection reveals the city, colors and one optional motto, then “Draft my team.”

The illustrated shortlist is Crushers, Pencils, Legends, Ducks, Ghosts, Cyclones, Rockets and Bandits. It is a proposed set, not a decision to delete the other clubs. Existing twelve-team saves should remain playable; the eight-team format should apply to new seasons with its own compatible schedule.

## Screen-by-screen direction

### Opening menu
Keep the new shaded logo banner. Keep two real choices: Quick Play and Season Mode. Demote Keeper League to a small future-mode note until it is playable; it currently occupies nearly as much space as an active option. With a saved season, show a concise “Continue · Week 4” line. Keep the primary choices visible together on short screens.

### Quick Play
The current controls work, but two native dropdowns make the screen feel like a form. Replace the visual presentation with two opposing club emblems and names, a clear “vs.”, simple team-change controls, and one Play button. Retain accessible text labels and native selection behavior where useful. Keep this route short; it does not need season navigation or management information.

### Draft and pick reveal
Use the compact comparison layout in concept 02. A selected O can make one brief paper-ring turn and settle into the progress strip. Target approximately 600–900 ms, with no mandatory waiting; reduced-motion users should receive the same confirmation without the spin.

The current full-page reveal and Next pick button after every pick add five repeated interruptions. Use inline confirmation for intermediate picks, and reserve the big “Meet your squad” formation reveal for the fifth pick or completed simulation. That makes the final reveal feel earned.

Keep Sim remaining picks available as a secondary text action. Preserve manual choices. Save after each committed pick and resume at the right point after a reload.

### Season hub
Keep the formation, but compress the repeated masthead and fit all five starters plus the next-game action in the first desktop viewport. At 1280 × 720 today, the lower part of the squad extends below the initial view.

Put the record, current week and last result together with the team name. Keep one strong next-game button. Maintain quiet links or disclosures for schedule, standings and full roster. On mobile, prioritize next matchup and a pinned Play action; keep the formation scrollable without overlapping names or tiny tap targets.

A last-touchdown replay is a good second-phase addition. Show it only when there is a recorded play, with a compact replay still and a clear play control. Use an actual recorded play, not a fabricated highlight. Start playback on request. Recording positions and ball movement locally does not require a database.

### Roster and scouting
Default to the five drafted starters. Put supporting players behind “Full roster.” The current sixteen-row roster makes the central characters feel less special and gives linemen the same visual importance as drafted players.

Keep names large, position compact, and key stats aligned. Remove the generic “personnel file” introduction and explanatory footer where the labels already explain the page. Keep all supporting players available for users who want them.

### Standings, schedule and leaders
Keep them secondary. With eight clubs, standings can be a short full table without an inner scrollbar. Highlight your row with an underline or faint pencil stripe, not a heavy filled panel. Show rank, club, wins and losses by default; reveal tiebreakers only when requested.

Schedule should distinguish past results, the next game and future fixtures. Bring the next fixture to the top when opened. Show the playoff bracket only once relevant.

Leaderboards should separate passing, rushing and receiving. The current combined yardage ranking gives quarterbacks an inherent advantage and makes a mixed-position comparison less meaningful. Use short category switches and a few leaders, with more detail on demand.

### Postgame and season completion
Treat the result as a small moment of reward: large score, win/loss, one or two relevant player performances, and a clear Back to squad action. A saved touchdown could offer Replay alongside it. Avoid a second dense statistics dashboard.

For a championship, add a brief hand-drawn trophy or stamp and preserve the season record. For elimination, make the outcome and remaining bracket clear. A new-season action should not silently destroy a season the player still wants to inspect.

## Visual system to carry across screens
- **Paper:** keep a warm ruled sheet; reduce the desk border on task-heavy screens.
- **Ink:** one readable dark blue for interface text. Use team color for identity accents, not low-contrast body copy.
- **Emphasis:** reserve a muted yellow pencil fill for the main action or selection. Avoid making every element a different visual event.
- **Typography:** handwriting for short titles and names; typewriter for values and supporting labels. Do not force long handwriting paragraphs.
- **Drawing:** team emblems can be expressive, but should be simpler than the most elaborate generated badge examples before becoming final small assets. Players remain Xs and Os.
- **Motion:** use it on picks, a touchdown replay and the final squad reveal. Do not make every O spin continuously.
- **Accessibility:** visible keyboard focus, real labels and numbers beside sketched meters, roughly 44-pixel tap targets, reduced-motion support, no meaning conveyed by color alone.
- **Responsive target:** the next meaningful action should appear without scrolling past a large brand header; the player card should fit its core data in one phone screen.

## Recommended implementation order
1. Compact header and navigation; shorten player cards; remove irrelevant WR Arm Strength.
2. Three-prospect draft layout; inline pick confirmation; one final squad reveal.
3. Eight-team setup and distinct emblems for new seasons, preserving existing saves.
4. Season hub hierarchy, five-starter roster default and simpler league views.
5. Actual local touchdown replay and postgame reward sequence.

A database is not needed to deliver steps 1–5 with the existing browser-local model. Add backend storage when cross-device saves, accounts or shared leagues become a real requirement.

## Generated concepts
1. [Season hub](01-season-hub.png): squad, next opponent, strong Play action, proposed replay.
2. [Draft](02-draft.png): three-way comparison and one committed choice.
3. [Eight-club selection](03-eight-clubs.png): fewer, more recognizable identities.
4. [Mobile player card](04-mobile-player.png): compact O portrait, relevant attributes and stats.

These are generated visual references, not pixel-perfect specifications. Numeric examples, exact font rendering and meter lengths should be rebuilt from real data in the implementation. The current logo asset can be preserved; the small logo in the concepts is an approximation. Use the corrected O version of the mobile card, not the earlier mascot variant.

[Generation prompts](PROMPTS.md) records the built-in image-generation brief and the targeted O-portrait correction.

