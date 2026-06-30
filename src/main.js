import { Game } from './game.js';
import { BackgroundSound } from './audio.js';

const canvas = document.getElementById('game-canvas');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const statusEl = document.getElementById('status');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const flashEl = document.getElementById('flash');
const soundBtn = document.getElementById('sound-btn');

const keys = { w: false, a: false, s: false, d: false };
const backgroundSound = new BackgroundSound();

const game = new Game(canvas, {
  onScoreChange(score) {
    scoreEl.textContent = `Score: ${score}`;
  },
  onTimerChange(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    timerEl.textContent = `Time: ${mins}:${secs.toString().padStart(2, '0')}`;
  },
  onStatusChange(text, className) {
    statusEl.textContent = text;
    statusEl.className = className || '';
  },
  onFlash(visible) {
    flashEl.classList.toggle('visible', visible);
    flashEl.classList.toggle('hidden', !visible);
  },
  onTag() {
    backgroundSound.accent();
    canvas.classList.remove('shake');
    void canvas.offsetWidth;
    canvas.classList.add('shake');
    window.setTimeout(() => canvas.classList.remove('shake'), 280);

    if (navigator.vibrate) {
      navigator.vibrate([80, 35, 80]);
    }
  },
});

game.setKeys(keys);

function resize() {
  game.resize();
}

function pointerToArena(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  if (!game.running) return;
  e.preventDefault();
  const { x, y } = pointerToArena(e.clientX, e.clientY);
  game.setPlayerTarget(x, y);
});

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k in keys) {
    keys[k] = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k in keys) {
    keys[k] = false;
  }
});

function startGame() {
  if (game.running) return;
  overlay.classList.remove('visible');
  overlay.classList.add('hidden');
  resize();
  backgroundSound.start();
  game.start();
}

startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) {
    startGame();
  }
});

soundBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const enabled = backgroundSound.toggle();
  soundBtn.textContent = enabled ? 'Sound On' : 'Sound Off';
  soundBtn.setAttribute('aria-label', enabled ? 'Mute background sound' : 'Unmute background sound');
});

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);

resize();
