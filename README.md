# Notebook Arcade

Small browser games drawn in ballpoint pen and pencil on notebook paper.

- **Splash Line** — draw water slides from the tower to the pool, pass Lifeguard Lou's inspection, then open them in your own water park and ride them in first person. Master different slide designs to unlock prize rides. A park journal guides four milestones toward Lou’s final inspection, with guest requests, amenities, ride upgrades, and a completion celebration. Drawings and parks save locally with a backup and export/import controls.
- **X’s & O’s Football** — draw receiver routes, hike, and steer your runner.
- **Doodle Slingshot** — fling doodles at scribbled towers.
- **Scribble Tennis** — play full-court rallies with lobs and hard shots.
- **Doodle Ballpark** — time a one-button swing against a pitcher who throws 80% strikes.
- **Eraser War** — lob erasers over scribbled hills and erase the terrain.

Paper Football remains available at `games/paper-football/`, and Will It Hold? and Margin Skater still live at `games/bridge/` and `games/margin-skater/`, off the home page. The alternative doodled landing page is preserved at `doodle.html`.

## Run locally

Run `node serve.js` and visit http://localhost:8791. GitHub Pages serves this repository’s root from `main`.

The Sites edition keeps these same public files under `dist/`; this GitHub copy preserves the root layout used by GitHub Pages, along with the additional Eraser War game.

## Checks

Run these from the repository root:

```sh
node tests/bridge.cjs
node tests/baseball.cjs
node tests/football-contact.cjs
node tests/football-audio.cjs
node tests/skater.cjs
node tests/tennis.cjs
```

Shared paper textures and drawing helpers live in `shared/`. Original branding is in `branding/`; font licenses are in `licenses/` and `assets/fonts/`.

## Football League

Football now opens to Quick Play and Season Mode, with eight clubs, a five-round draft, saved squads, position-specific attributes and stats, and recorded touchdown replays. Keeper League is marked coming soon. Player Mode is the default; the optional Auto play design switch starts off. On-field O’s are blue and X’s are red.

Phones get a larger field, a compact scoreboard, Run/Pass tabs, thumb steering, and independent pass aiming. Desktop keeps the notebook-on-desk layout. Player cards use unlined textured paper with torn edges, and primary buttons use yellow pencil shading.

Football source is in `games/xo-football/`. Run `node tests/football-phone.cjs`, `node tests/football-coach.cjs`, `node tests/football-season-game.cjs`, and `node tests/football-replay.cjs` from the repository root. This GitHub edition retains the root layout used by GitHub Pages and the existing games.

Splash Line has expressive notebook guests and customizable entrance signs. Seaside Blue, Warm Boardwalk, and Summer Festival become available after opening 3, 5, and 7 different slide designs. Styles cost game tickets once, remain owned, and can be switched freely from the park entrance or journal.

Splash Line checks: `node tests/splash-line-pov.cjs` and `node tests/splash-line-care.cjs`. The latter covers forgiving slide starts, save recovery, progression, attainable requests, and entrance purchases. Native iPad packaging and physical-device testing remain separate release work.
