"use strict";
/* flip. — smoke suite. Run: node test/core-test.js
   The important one is the bot test at the bottom: if a bot that only knows
   "flip toward the gap" can score, the game is fair by construction. */

const assert = require("assert");
const C = require("../app/core.js");

function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// 1. constants sane
assert.strictEqual(C.W, 360);
assert.strictEqual(C.H, 640);

// 2. reachability: every gap ever spawned sits inside the playable band
for (let i = 0; i < 2000; i += 1) {
  const g = C.gapYFor(i);
  assert(g > C.GAP_H / 2 && g < C.H - C.GAP_H / 2, "gap " + i + " out of band: " + g);
}

// 3. speed ramps and caps
assert.strictEqual(C.speedFor(0), C.START_SPEED);
assert.strictEqual(C.speedFor(1000), C.MAX_SPEED);
assert(C.speedFor(5) > C.speedFor(2), "speed must ramp with score");

// 4. determinism: identical flip scripts must produce identical runs
function runWith(flips) {
  const w = C.newWorld();
  for (let f = 0; f < 60 * 60; f += 1) {
    const t = f / 60;
    if (flips(f)) C.tryFlip(w, t);
    C.step(w, 1 / 60);
    if (w.over) break;
  }
  return { y: Math.round(w.y * 1000), score: w.score, t: Math.round(w.t * 1000) };
}
const ra = runWith((f) => f % 37 === 0);
const rb = runWith((f) => f % 37 === 0);
assert.deepStrictEqual(ra, rb, "same flips must give the same run");
console.log("determinism ok, script run ended:", ra.score, "walls");

// 5. no NaN, ball stays in bounds, and random play eventually dies
{
  const rnd = lcg(12345);
  const w = C.newWorld();
  let sawDead = false;
  for (let f = 0; f < 60 * 120; f += 1) {
    const t = f / 60;
    if (rnd() < 0.25) C.tryFlip(w, t);
    const ev = C.step(w, 1 / 60);
    if (ev === "dead") { sawDead = true; break; }
    assert(Number.isFinite(w.y) && Number.isFinite(w.vy), "NaN at frame " + f);
    assert(w.y >= C.BALL_R - 0.001 && w.y <= C.H - C.BALL_R + 0.001, "out of bounds y=" + w.y);
  }
  assert(sawDead, "random play should die eventually");
  console.log("random play: NaN-free, bounded, died as expected");
}

// 6. flip cooldown blocks spam
{
  const w = C.newWorld();
  assert.strictEqual(C.tryFlip(w, 0), true);
  assert.strictEqual(C.tryFlip(w, 0.05), false, "cooldown must block spam");
  assert.strictEqual(C.tryFlip(w, 0.12), true, "cooldown must expire");
  assert.strictEqual(C.tryFlip(w, 0.13), false, "and re-engage");
}

// 7. never flipping kills you (ball parks at the bottom edge, gap is mid-screen)
{
  const w = C.newWorld();
  let dead = false;
  for (let f = 0; f < 60 * 8; f += 1) {
    const ev = C.step(w, 1 / 60);
    if (ev === "dead") { dead = true; break; }
  }
  assert(dead, "never flipping should die on wall 0");
  console.log("passive player dies. good.");
}

// 8. THE BOT. One rule: if the next gap is above me and gravity pulls down,
//    flip. If it's below me and gravity pulls up, flip. That's it.
//    If this clears 20 walls in 60s, the game is winnable by construction.
{
  const w = C.newWorld();
  const deadzone = 18;
  let flips = 0;
  for (let f = 0; f < 60 * 60; f += 1) {
    const t = f / 60;
    const next = w.walls.find((x) => x.x > C.BALL_X && !x.passed);
    if (next) {
      if (next.gapY < w.y - deadzone && w.dir === 1) {
        if (C.tryFlip(w, t)) flips += 1;
      } else if (next.gapY > w.y + deadzone && w.dir === -1) {
        if (C.tryFlip(w, t)) flips += 1;
      }
    }
    const ev = C.step(w, 1 / 60);
    if (ev === "dead") break;
  }
  console.log("bot:", w.score, "walls in", Math.round(w.t), "s with", flips, "flips");
  assert(w.score >= 20, "bot should clear 20 walls in 60s, got " + w.score);
}

console.log("ALL PASS");
