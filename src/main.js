// --- Bootstrap: create canvases, wire controls, rAF loop ---

import { computeState } from './state.js';
import { standing } from './scenarios/standing.js';
import { armInTriangle } from './scenarios/armInTriangle.js';
import { renderTensionHeatmap } from './panels/tensionHeatmap.js';
import { renderConnectionLines } from './panels/connectionLines.js';
import { renderForceFlow } from './panels/forceFlow.js';
import { renderStacking } from './panels/stackingAlignment.js';

// --- Scenario registry ---
const scenarios = {
  standing,
  armInTriangle,
};

let scenario = standing;

// --- DOM refs ---
const slider = document.getElementById('slider');
const sliderLabel = document.getElementById('slider-label');
const stepsContainer = document.getElementById('steps');
const scenarioSelect = document.getElementById('scenario-select');
const autoplayBtn = document.getElementById('autoplay-btn');
const tooltip = document.getElementById('tooltip');
const canvases = [
  document.getElementById('canvas-tension'),
  document.getElementById('canvas-connections'),
  document.getElementById('canvas-force'),
  document.getElementById('canvas-stacking'),
];
const ctxs = canvases.map(c => c.getContext('2d'));

// Screen reader panel descriptions
const srPanels = {
  tension: document.getElementById('sr-tension'),
  connections: document.getElementById('sr-connections'),
  force: document.getElementById('sr-force'),
  stacking: document.getElementById('sr-stacking'),
};

// --- Sizing ---
function resize() {
  for (const canvas of canvases) {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.logicalWidth = rect.width;
    canvas.logicalHeight = rect.height;
  }
}

// --- Step buttons ---
function buildSteps() {
  stepsContainer.innerHTML = '';
  for (const kf of scenario.keyframes) {
    const btn = document.createElement('button');
    btn.className = 'step-btn';
    btn.textContent = kf.label;
    btn.title = kf.description;
    btn.setAttribute('aria-label', `${kf.label}: ${kf.description}`);
    btn.addEventListener('click', () => {
      stopAutoplay();
      animateSliderTo(kf.t);
    });
    stepsContainer.appendChild(btn);
  }
}

// --- Scenario selector ---
scenarioSelect.addEventListener('change', () => {
  const key = scenarioSelect.value;
  if (scenarios[key]) {
    scenario = scenarios[key];
    slider.value = 0;
    stopAutoplay();
    buildSteps();
  }
});

// --- Smooth slider animation ---
let animTarget = null;
let animStart = null;
let animFrom = null;
const ANIM_DURATION = 600; // ms

function animateSliderTo(target) {
  animTarget = target;
  animStart = performance.now();
  animFrom = parseFloat(slider.value);
}

function updateAnimatedSlider(now) {
  if (animTarget === null) return;
  const elapsed = now - animStart;
  const progress = Math.min(elapsed / ANIM_DURATION, 1);
  const eased = progress * progress * (3 - 2 * progress);
  const value = animFrom + (animTarget - animFrom) * eased;
  slider.value = value;
  if (progress >= 1) {
    animTarget = null;
  }
}

// --- Auto-play ---
let autoplayActive = true; // starts playing on load
const AUTOPLAY_SPEED = 0.08; // slider units per second

function toggleAutoplay() {
  autoplayActive = !autoplayActive;
  autoplayBtn.classList.toggle('playing', autoplayActive);
  const icon = autoplayBtn.querySelector('.play-icon');
  icon.textContent = autoplayActive ? '⏸' : '▶';
  autoplayBtn.setAttribute('aria-label', autoplayActive ? 'Pause auto-advance' : 'Play auto-advance');
}

function stopAutoplay() {
  if (autoplayActive) {
    autoplayActive = false;
    autoplayBtn.classList.remove('playing');
    autoplayBtn.querySelector('.play-icon').textContent = '▶';
    autoplayBtn.setAttribute('aria-label', 'Play auto-advance');
  }
}

autoplayBtn.addEventListener('click', toggleAutoplay);

// Stop autoplay when user manually drags slider
slider.addEventListener('input', () => {
  if (autoplayActive) stopAutoplay();
  animTarget = null; // cancel any ongoing animation
});

let lastAutoplayTime = 0;

function updateAutoplay(now) {
  if (!autoplayActive) {
    lastAutoplayTime = now;
    return;
  }
  const dt = (now - lastAutoplayTime) / 1000;
  lastAutoplayTime = now;

  let val = parseFloat(slider.value) + AUTOPLAY_SPEED * dt;
  if (val >= 1) {
    val = 1;
    stopAutoplay();
  }
  slider.value = val;
}

// --- Tooltips ---
const PANEL_TOOLTIPS = [
  {
    title: 'Tension Economy 無駄を省く',
    body: 'Heat shows parasitic (wasted) tension. Cool blue = efficient. Hot red = energy leak. As you self-organize, tension migrates from extremities into the core.',
  },
  {
    title: 'Internal Connections 体の統一',
    body: 'Cyan arcs show kinetic chains linking distant body parts through the core. The purple arch connects feet through hips. Stronger connections = unified structure.',
  },
  {
    title: 'Force Flow 地面への道',
    body: 'Animated dashes show how an external push at the shoulder travels to the ground. Red pooling = force is stuck. Green flow = force reaches the earth.',
  },
  {
    title: 'Stacking 整列',
    body: 'Dots show four landmarks (ear, shoulder, hip, ankle) relative to a plumb line. Green = aligned over ankles. Orange = off-axis. Percentage shows overall alignment.',
  },
];

function showTooltip(x, y, content) {
  tooltip.innerHTML = `<strong>${content.title}</strong><br>${content.body}`;
  tooltip.classList.add('visible');
  tooltip.setAttribute('aria-hidden', 'false');

  // Position: offset to avoid going off-screen
  const pad = 12;
  const rect = tooltip.getBoundingClientRect();
  let left = x + pad;
  let top = y + pad;
  if (left + 240 > window.innerWidth) left = x - 240 - pad;
  if (top + rect.height > window.innerHeight) top = y - rect.height - pad;
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function hideTooltip() {
  tooltip.classList.remove('visible');
  tooltip.setAttribute('aria-hidden', 'true');
}

canvases.forEach((canvas, i) => {
  canvas.addEventListener('pointerenter', (e) => {
    showTooltip(e.clientX, e.clientY, PANEL_TOOLTIPS[i]);
  });
  canvas.addEventListener('pointermove', (e) => {
    showTooltip(e.clientX, e.clientY, PANEL_TOOLTIPS[i]);
  });
  canvas.addEventListener('pointerleave', hideTooltip);
});

// --- Accessibility: screen reader descriptions ---
let lastSrLabel = '';

function updateScreenReaderDescriptions(state) {
  // Only update when label changes to avoid excessive announcements
  if (state.label === lastSrLabel) return;
  lastSrLabel = state.label;

  const topTension = Object.entries(state.tension)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
    .join(', ');

  srPanels.tension.textContent = `${state.label}: highest tension in ${topTension}`;

  const activeConns = Object.entries(state.connections)
    .filter(([, v]) => v > 0.3)
    .map(([k]) => k)
    .join(', ');
  srPanels.connections.textContent = `${state.label}: active connections: ${activeConns || 'none'}`;

  srPanels.force.textContent = `${state.label}: force efficiency ${Math.round(state.forceEfficiency * 100)}%`;

  srPanels.stacking.textContent = `${state.label}: ${state.description}`;
}

// --- Keyboard support ---
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    toggleAutoplay();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    stopAutoplay();
    slider.value = Math.min(1, parseFloat(slider.value) + 0.02);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    stopAutoplay();
    slider.value = Math.max(0, parseFloat(slider.value) - 0.02);
  } else if (e.key >= '1' && e.key <= '4') {
    const idx = parseInt(e.key) - 1;
    if (idx < scenario.keyframes.length) {
      stopAutoplay();
      animateSliderTo(scenario.keyframes[idx].t);
    }
  }
});

// --- Render loop ---
let startTime = performance.now();

function render(now) {
  const time = (now - startTime) / 1000;

  updateAnimatedSlider(now);
  updateAutoplay(now);

  const t = parseFloat(slider.value);
  const state = computeState(scenario, t);

  // Update ARIA on slider
  slider.setAttribute('aria-valuenow', t.toFixed(2));

  // Update label
  sliderLabel.textContent = `${state.label} — ${state.description}`;

  // Update step button active state
  const stepBtns = stepsContainer.querySelectorAll('.step-btn');
  stepBtns.forEach((btn, i) => {
    const kfT = scenario.keyframes[i].t;
    const isActive = Math.abs(t - kfT) < 0.01;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive);
  });

  // Update screen reader descriptions
  updateScreenReaderDescriptions(state);

  // Render all panels
  const w0 = canvases[0].logicalWidth;
  const h0 = canvases[0].logicalHeight;
  renderTensionHeatmap(ctxs[0], state, w0, h0);

  const w1 = canvases[1].logicalWidth;
  const h1 = canvases[1].logicalHeight;
  renderConnectionLines(ctxs[1], state, w1, h1, time);

  const w2 = canvases[2].logicalWidth;
  const h2 = canvases[2].logicalHeight;
  renderForceFlow(ctxs[2], state, w2, h2, time);

  const w3 = canvases[3].logicalWidth;
  const h3 = canvases[3].logicalHeight;
  renderStacking(ctxs[3], state, w3, h3);

  requestAnimationFrame(render);
}

// --- Init ---
window.addEventListener('resize', resize);
resize();
buildSteps();
requestAnimationFrame(render);
