"use strict";
/* flip. — core game logic.
   Pure and deterministic: the whole world is ONE sine wave.
   No Math.random, no Date, no luck. Same flips, same run. */

const Core = (() => {
  const W = 360;
  const H = 640;

  const BALL_R = 11;
  const BALL_X = 96;

  const GRAVITY = 980;      // px/s^2
  const MAX_FALL = 560;     // px/s
  const FLIP_DAMP = 0.55;   // velocity kept on flip (swoop, not instant turn)
  const FLIP_KICK = 90;     // px/s pushed toward new direction on flip
  const FLIP_COOLDOWN = 0.11; // s between flips (spam is not a strategy)

  const WALL_W = 16;
  const GAP_H = 118;
  const SPACING = 270;      // px between walls
  const START_SPEED = 190;  // px/s
  const SPEED_STEP = 10;    // px/s faster per wall passed
  const MAX_SPEED = 400;
  const GAP_AMP = 185;      // sine amplitude of the gap path
  const SINE_STEP = Math.PI / 2.2; // ~4.4 walls per full up-down cycle
  const EDGE_BOUNCE = 0.55; // top/bottom are soft, not lethal

  // The gap for wall i is a pure function of i. That is the whole level.
  function gapYFor(i) {
    return H / 2 + GAP_AMP * Math.sin(i * SINE_STEP);
  }

  function speedFor(score) {
    return Math.min(MAX_SPEED, START_SPEED + score * SPEED_STEP);
  }

  function newWorld() {
    return {
      y: H / 2,
      vy: 0,
      dir: 1,           // +1 gravity pulls down, -1 pulls up
      dist: 0,
      spawned: 0,
      walls: [],
      score: 0,
      over: false,
      lastFlipAt: -10,
      t: 0,
    };
  }

  function tryFlip(world, t) {
    if (world.over) return false;
    if (t - world.lastFlipAt < FLIP_COOLDOWN) return false;
    world.dir *= -1;
    world.vy = -world.vy * FLIP_DAMP + world.dir * FLIP_KICK;
    world.lastFlipAt = t;
    return true;
  }

  // Advances the world by dt seconds (use fixed dt in the game loop).
  // Returns "pass" / "dead" / null for this step.
  function step(world, dt) {
    if (world.over) return "over";
    world.t += dt;

    world.vy += world.dir * GRAVITY * dt;
    if (world.vy > MAX_FALL) world.vy = MAX_FALL;
    if (world.vy < -MAX_FALL) world.vy = -MAX_FALL;
    world.y += world.vy * dt;

    if (world.y < BALL_R) {
      world.y = BALL_R;
      if (world.vy < 0) world.vy = -world.vy * EDGE_BOUNCE;
    } else if (world.y > H - BALL_R) {
      world.y = H - BALL_R;
      if (world.vy > 0) world.vy = -world.vy * EDGE_BOUNCE;
    }

    world.speed = speedFor(world.score);
    world.dist += world.speed * dt;
    while (world.spawned * SPACING < world.dist) {
      world.walls.push({
        i: world.spawned,
        x: W + WALL_W,
        gapY: gapYFor(world.spawned),
        passed: false,
      });
      world.spawned += 1;
    }

    let event = null;
    for (const wall of world.walls) {
      wall.x -= world.speed * dt;
      if (wall.passed) continue;
      const nearX =
        wall.x + WALL_W / 2 > BALL_X - BALL_R &&
        wall.x - WALL_W / 2 < BALL_X + BALL_R;
      if (!nearX) continue;
      const hh = (GAP_H - BALL_R * 2) / 2;
      if (Math.abs(world.y - wall.gapY) > hh) {
        world.over = true;
        return "dead";
      }
      wall.passed = true;
      world.score += 1;
      event = "pass";
    }
    world.walls = world.walls.filter((w) => w.x > -WALL_W * 2);
    return event;
  }

  return {
    newWorld,
    tryFlip,
    step,
    gapYFor,
    speedFor,
    W,
    H,
    BALL_X,
    BALL_R,
    WALL_W,
    GAP_H,
    GAP_AMP,
    START_SPEED,
    MAX_SPEED,
    SPACING,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Core;
}
