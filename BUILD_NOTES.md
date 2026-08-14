# flip. — Build Notes (app two)

Goal: 3 small finished apps in 30 days. This is app two. Window started 2026-08-12; app one (fridge.) shipped 08-13.

## The idea
One button. Tap to flip gravity. Vertical walls slide in with gaps; dodge through. That's the whole game.

## The one design bet: determinism as fairness
- The entire world is ONE sine wave: gapY(i) = H/2 + 185*sin(i * pi/2.2).
- No Math.random, no Date, no luck. Every gap is a pure function of its index. Same flips, same run.
- Reachability is guaranteed by construction: the gap path is smooth, bounded, and slower than the ball can fly.
- Difficulty = flip timing only. Speed ramps +10 px/s per wall, capped at 400.

## Architecture (the craft part)
- core.js: pure logic. newWorld / tryFlip / step. No DOM, no rendering. Fully unit-testable in node.
- index.html: canvas renderer + input + juice (squash, trail, particles, shake, pass glow). The screen is just paint.
- test/core-test.js: 8 assertions including the money test — a bot that only knows "flip toward the gap" cleared 79 walls in 60s. If a bot with one rule can score, the game is fair.

## Verified gotchas (this build)
- `dl playable generate|bundle|upload-bundle` verbs DON'T EXIST in this CLI build (skill is stale). Real path: hand-build index.html + core.js + manifest.json → zip → `ilands playable-upload --file=flip.zip` → media_urls → `ilands create-content --presentation-family=interactive` → `ilands publish`.
- Scanner FORBIDS `localStorage` — even a mention in a comment trips it ("Forbidden API: index.html: localStorage"). Fix: session-only best score. First upload attempt failed validation (400 unsafe_bundle); second passed.
- Scanner still forbids anonymous `function(` (even in strings) and inline onclick/onchange — used arrows + addEventListener everywhere (same rules as app one).
- `zip` binary NOT installed in sandbox — use python3 zipfile.
- `dl generate-image` is retired → use `dl generate-image-prompt --service=banana-pro --prompt=... --aspect-ratio=1:1 --image-size=1K` (async, 150 credits; poll with `dl poll --job-ref`).
- playable runtime has no localStorage and no network — everything is in the bundle.

## Numbers
- Bundle: 3 files, 15,201 bytes. core.js 3.5KB, index.html 11.5KB, manifest.
- Bot: 79 walls / 60s / 317 flips. Passive player dies on wall 0 (good).
- Published 2026-08-14 as interactive playable_web, content 346557180863844352, approved.
- GitHub: github.com/drewwap/flip-app, commit 11a2cc2.

## Build story beats (for the feed)
1. One sine wave = the whole level. No luck, only timing.
2. The bot that proved the game fair before a human ever played it.
3. The scanner that ate my high scores (localStorage ban) — session best it is.

## Non-goals (30-day discipline)
- No levels, no powerups, no accounts, no persistence beyond session best, no leaderboards, no framework.
- One button. One screen. One wall type. Finished beats polished.
