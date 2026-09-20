# Margin Skater — artwork and critique

Created with the built-in image-generation tool. Original full-resolution images are preserved in the game assets.

- [Cover](../../games/margin-skater/assets/cover-v1.png)
- [Notebook background](../../games/margin-skater/assets/paper-v1.png)

## Review and decisions

The cover's readable lettering, oversized sneakers, backwards cap, and eraser give the game personality. Its dense crosshatching works at title-screen size but would obscure the small skater during play. Use it for the cover and arcade card, not as the moving character or collision scenery.

The background provides the right hierarchy: faint ink doodles above the course, with clear ruled paper behind moving objects. Its repeating motifs are visible on wide screens; a slow parallax pass and restrained opacity keep them secondary. Rails, erasers, terrain, and the animated skater are drawn from the actual game geometry so their visible contact surfaces match the physics.

The first playable review caught a very short key tap being missed between simulation ticks. Input now preserves that press until the next physics update. The skater also gained a push-off animation. Mobile instructions use the touch button names.

## Final prompts

### Cover

Use case: stylized-concept. Asset type: finished landscape cover illustration for the browser game Margin Skater in Notebook Arcade. Draw a wonderfully scruffy energetic blue ballpoint-pen illustration on very light warm ivory notebook paper. A tiny expressive lanky stick figure skater wearing a backwards cap and oversized sneakers does a stylish ollie over a giant pink eraser, between a bent staple grind rail and a curled torn-paper ramp. Strong readable side-on silhouette, two wheels and distinct skateboard deck, charming hand-drawn anatomy, loose construction lines and crosshatching, red teacher-pencil arrows and tiny stars, a few faint pale blue ruled lines. Hand-letter the exact words 'MARGIN SKATER' large across the upper left in lively irregular blue ink uppercase, smaller handwritten 'made for the margins.' beneath. Main skater in right half, dynamic diagonal but side-view scene, a doodle students would actually draw in the back of a notebook. Sparse confident composition with generous blank paper. No UI buttons, no photography, no 3D rendering, no gradients, no glossy vector art, no extra text. Wide landscape 1536x1024.

### Background

Use case: stylized-concept. Asset type: background illustration for a side-scrolling hand-drawn notebook skateboarding game. Wide landscape 1536x1024, warm almost-white uncoated paper with very faint blue horizontal ruled notebook lines. Sparse tiny blue ballpoint-pen doodles collected only along the TOP 25 percent: a little Saturn, a lightning bolt, a sleepy cloud, three scruffy stars, a small sneaker, a paper airplane with a dashed loop, and a wonky checkerboard patch, all drawn casually by a student with light construction strokes and occasional red-pencil accents. The bottom 75 percent is empty ruled paper for actual moving game characters and platforms. No floor, no platforms, no skateboarder, no text whatsoever, no interface, no dark or heavy shaded areas, no border. Authentic restrained notebook marginalia, airy and very faint compared to foreground blue ink game objects. Flat paper scanned straight-on, no perspective.
