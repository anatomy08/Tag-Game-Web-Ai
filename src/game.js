import { Entity } from './entity.js';
import { updateBotAI } from './botAI.js';
import { render } from './render.js';
import { resolveEntityCollisions } from './physics.js';

const ROUND_DURATION = 60;
const TAG_BUFFER = 2;
const TAG_COOLDOWN = 2;
const TAG_SPEED_BOOST = 1.45;
const TAG_SPEED_BOOST_HOLD = 3.2;
const TAG_SPEED_BOOST_FADE = 1.8;
const BOT_COUNT = 4;
const ARENA_MAX_WIDTH = 720;
const ARENA_MAX_HEIGHT = 480;
const ARENA_PADDING = 32;
const BOT_COLORS = ['#ffd369', '#a29bfe', '#fd79a8', '#55efc4', '#74b9ff'];

export class Game {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
    this.player = null;
    this.bots = [];
    this.entities = [];
    this.score = 0;
    this.survivalStreak = 0;
    this.bestStreak = 0;
    this.roundTimeLeft = ROUND_DURATION;
    this.running = false;
    this.lastTimestamp = 0;
    this.pulsePhase = 0;
    this.flashTimer = 0;
    this.tagCooldownLeft = 0;
    this.keys = { w: false, a: false, s: false, d: false };
    this.bounds = { left: 0, top: 0, right: 0, bottom: 0 };
    this.canvasSize = { width: 0, height: 0 };
  }

  setKeys(keys) {
    this.keys = keys;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.canvasSize = { width: rect.width, height: rect.height };

    const arenaW = Math.min(ARENA_MAX_WIDTH, rect.width - ARENA_PADDING * 2);
    const arenaH = Math.min(ARENA_MAX_HEIGHT, rect.height - ARENA_PADDING * 2);
    this.bounds = {
      left: (rect.width - arenaW) / 2,
      top: (rect.height - arenaH) / 2,
      right: (rect.width + arenaW) / 2,
      bottom: (rect.height + arenaH) / 2,
    };
  }

  start() {
    this.score = 0;
    this.survivalStreak = 0;
    this.bestStreak = 0;
    this.running = true;
    this.lastTimestamp = 0;
    this.startRound();
    this.callbacks.onScoreChange?.(this.score);
    requestAnimationFrame((t) => this.loop(t));
  }

  startRound() {
    this.roundTimeLeft = ROUND_DURATION;
    this.spawnEntities();
    this.pickRandomIt();
    this.callbacks.onTimerChange?.(this.roundTimeLeft);
    this.updateStatus();
  }

  spawnEntities() {
    const { left, top, right, bottom } = this.bounds;
    const w = right - left;
    const h = bottom - top;
    const playerX = left + w * 0.5;
    const playerY = top + h * 0.5;

    if (!this.player) {
      this.player = new Entity({ x: playerX, y: playerY, radius: 18, color: '#4ecca3', speed: 220, isPlayer: true, name: 'You' });
    } else {
      this.player.resetPosition(playerX, playerY);
      this.player.isIt = false;
    }

    this.bots = [];
    for (let i = 0; i < BOT_COUNT; i++) {
      const angle = (i / BOT_COUNT) * Math.PI * 2;
      const dist = Math.min(w, h) * 0.3;
      this.bots.push(new Entity({
        x: playerX + Math.cos(angle) * dist,
        y: playerY + Math.sin(angle) * dist,
        radius: 16,
        color: BOT_COLORS[i % BOT_COLORS.length],
        speed: 170,
        name: 'Bot ' + (i + 1),
      }));
    }

    this.entities = [this.player, ...this.bots];
    resolveEntityCollisions(this.entities, this.bounds, 8);
  }

  pickRandomIt() {
    for (const entity of this.entities) entity.isIt = false;
    this.entities[Math.floor(Math.random() * this.entities.length)].isIt = true;
    this.updateStatus();
  }

  setPlayerTarget(x, y) {
    if (!this.running) return;
    const { left, top, right, bottom } = this.bounds;
    this.player.setTarget(
      Math.max(left + this.player.radius, Math.min(right - this.player.radius, x)),
      Math.max(top + this.player.radius, Math.min(bottom - this.player.radius, y))
    );
  }

  loop(timestamp) {
    if (!this.running) return;
    const deltaTime = this.lastTimestamp ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.05) : 0;
    this.lastTimestamp = timestamp;
    this.update(deltaTime, timestamp);
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(deltaTime, timestamp) {
    this.pulsePhase += deltaTime * 4;
    this.roundTimeLeft -= deltaTime;

    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) this.callbacks.onFlash?.(false);
    }
    if (this.tagCooldownLeft > 0) this.tagCooldownLeft = Math.max(0, this.tagCooldownLeft - deltaTime);
    if (this.roundTimeLeft <= 0) {
      this.startRound();
      return;
    }

    for (const bot of this.bots) updateBotAI(bot, this.entities, this.bounds, timestamp);
    for (const entity of this.entities) entity.updateSpeedBoost(deltaTime);
    this.movePlayer(deltaTime);
    for (const bot of this.bots) bot.moveTowardTarget(deltaTime, this.bounds);

    resolveEntityCollisions(this.entities, this.bounds);
    this.checkTagCollisions();

    if (!this.player.isIt) {
      this.survivalStreak += deltaTime;
      if (this.survivalStreak > this.bestStreak) this.bestStreak = this.survivalStreak;
    }

    this.callbacks.onTimerChange?.(Math.max(0, this.roundTimeLeft));
  }

  movePlayer(deltaTime) {
    let dx = 0;
    let dy = 0;
    if (this.keys.w) dy -= 1;
    if (this.keys.s) dy += 1;
    if (this.keys.a) dx -= 1;
    if (this.keys.d) dx += 1;
    if (dx !== 0 || dy !== 0) this.player.moveByInput(dx, dy, deltaTime, this.bounds);
    else this.player.moveTowardTarget(deltaTime, this.bounds);
  }

  checkTagCollisions() {
    if (this.tagCooldownLeft > 0) return;
    const itEntity = this.entities.find((e) => e.isIt);
    if (!itEntity) return;

    for (const entity of this.entities) {
      if (entity === itEntity) continue;
      const touchDist = itEntity.radius + entity.radius + TAG_BUFFER;
      if (itEntity.distanceTo(entity) < touchDist) {
        this.transferIt(itEntity, entity);
        break;
      }
    }
  }

  transferIt(from, to) {
    from.isIt = false;
    to.isIt = true;
    this.tagCooldownLeft = TAG_COOLDOWN;

    for (const entity of this.entities) {
      if (!entity.isIt) entity.applySpeedBoost(TAG_SPEED_BOOST, TAG_SPEED_BOOST_HOLD, TAG_SPEED_BOOST_FADE);
    }

    if (from.isPlayer && to !== this.player) {
      this.score += 10;
      this.callbacks.onScoreChange?.(this.score);
    }
    if (to.isPlayer && from !== this.player) {
      this.survivalStreak = 0;
      this.flashTimer = 1.2;
      this.callbacks.onFlash?.(true);
    }
    this.updateStatus();
    this.callbacks.onTag?.();
  }

  updateStatus() {
    this.callbacks.onStatusChange?.(this.player.isIt ? 'You are IT!' : 'RUN!', this.player.isIt ? 'it' : 'run');
  }

  draw() {
    render(this.ctx, {
      bounds: this.bounds,
      canvasSize: this.canvasSize,
      entities: this.entities,
      player: this.player,
      pulsePhase: this.pulsePhase,
      score: this.score,
      timeLeft: Math.max(0, this.roundTimeLeft),
    });
  }
}
