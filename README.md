# Notebook Arcade

Small browser games drawn in ballpoint pen and pencil on notebook paper.

- **Doodle Slingshot** — fling doodles at scribbled towers.
- **X’s & O’s Football** — draw receiver routes, hike, and steer your runner.
- **Scribble Tennis** — play full-court rallies with lobs and hard shots.
- **Doodle Ballpark** — time a one-button swing against a pitcher who throws 80% strikes.
- **Eraser War** — lob erasers over scribbled hills and erase the terrain.
- **Will It Hold?** — draw roads and braces to carry an egg truck across four increasingly awkward rivers. Your actual strokes bend and break; win to advance or choose a numbered level.

- **Margin Skater** — charge ollies, grind stationery, and link flips across three notebook skate parks. Includes touch controls, checkpoints, and saved best scores.

Paper Football remains available at `games/paper-football/`. The alternative doodled landing page is preserved at `doodle.html`.

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
