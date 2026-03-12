// --- Bootstrap: create canvases, wire controls, rAF loop ---

import { computeState } from './state.js';
import { standing } from './scenarios/standing.js';
import { armInTriangle } from './scenarios/armInTriangle.js';
import { renderTensionHeatmap } from './panels/tensionHeatmap.js';
import { renderConnectionLines } from './panels/connectionLines.js';
import { renderForceFlow } from './panels/forceFlow.js';
import { renderStacking } from './panels/stackingAlignment.js';
import { lerp, clamp, easeInOut } from './utils/math.js';

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
const playIcon = autoplayBtn.querySelector('.play-icon');
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

// Panel renderers: [render fn, needs time param]
const panels = [
  { render: renderTensionHeatmap, usesTime: false },
  { render: renderConnectionLines, usesTime: true },
  { render: renderForceFlow, usesTime: true },
  { render: renderStacking, usesTime: false },
];

// --- Sizing ---
function resize() {
  canvases.forEach((canvas, i) => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctxs[i].setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.logicalWidth = rect.width;
    canvas.logicalHeight = rect.height;
  });
}

// --- Step buttons ---
let stepBtns = [];

function buildSteps() {
  stepsContainer.innerHTML = '';
  stepBtns = [];
  for (const kf of scenario.keyframes) {
    const btn = document.createElement('button');
    btn.className = 'step-btn';
    btn.textContent = kf.label;
    btn.title = kf.description;
    btn.setAttribute('aria-label', `${kf.label}: ${kf.description}`);
    btn.addEventListener('click', () => {
      setAutoplayState(false);
      animateSliderTo(kf.t);
    });
    stepsContainer.appendChild(btn);
    stepBtns.push(btn);
  }
}

// --- Scenario selector ---
scenarioSelect.addEventListener('change', () => {
  const key = scenarioSelect.value;
  if (scenarios[key]) {
    scenario = scenarios[key];
    slider.value = 0;
    setAutoplayState(false);
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
  slider.value = lerp(animFrom, animTarget, easeInOut(progress));
  if (progress >= 1) {
    animTarget = null;
  }
}

// --- Auto-play ---
let autoplayActive = true; // starts playing on load
let userPaused = false; // true when user explicitly pauses — disables looping
const AUTOPLAY_SPEED = 0.08; // slider units per second
const LOOP_PAUSE_MS = 3000; // pause at end before restarting
let lastAutoplayTime = 0;
let loopPauseUntil = 0; // timestamp when loop pause ends
let autoplayValue = 0; // tracked as float to avoid slider step-snapping

function setAutoplayState(playing) {
  if (autoplayActive === playing) return;
  autoplayActive = playing;
  autoplayBtn.classList.toggle('playing', playing);
  playIcon.textContent = playing ? '⏸' : '▶';
  autoplayBtn.setAttribute('aria-label', playing ? 'Pause auto-advance' : 'Play auto-advance');
  if (playing) {
    lastAutoplayTime = performance.now();
    autoplayValue = parseFloat(slider.value);
  }
}

autoplayBtn.addEventListener('click', () => {
  userPaused = autoplayActive; // if currently playing, user is pausing
  loopPauseUntil = 0;
  if (!autoplayActive && parseFloat(slider.value) >= 1) slider.value = 0;
  setAutoplayState(!autoplayActive);
});

// Stop autoplay when user manually drags slider
slider.addEventListener('input', () => {
  userPaused = true;
  loopPauseUntil = 0;
  setAutoplayState(false);
  animTarget = null;
});

function updateAutoplay(now) {
  // Handle loop pause at end
  if (loopPauseUntil > 0) {
    if (now >= loopPauseUntil) {
      loopPauseUntil = 0;
      autoplayValue = 0;
      slider.value = 0;
      lastAutoplayTime = now;
      setAutoplayState(true);
    }
    return;
  }

  if (!autoplayActive) return;
  if (lastAutoplayTime === 0) lastAutoplayTime = now; // seed on first frame
  const dt = Math.min((now - lastAutoplayTime) / 1000, 0.1); // cap to avoid jump
  lastAutoplayTime = now;

  autoplayValue += AUTOPLAY_SPEED * dt;
  if (autoplayValue >= 1) {
    autoplayValue = 1;
    slider.value = 1;
    setAutoplayState(false);
    if (!userPaused) {
      loopPauseUntil = now + LOOP_PAUSE_MS;
    }
    return;
  }
  slider.value = autoplayValue;
}

// --- Tooltips ---
const PANEL_TOOLTIPS = [
  {
    title: 'Tension Economy 無駄を省く',
    body: 'Heat shows parasitic (wasted) tension. Cool blue = efficient. Hot red = energy leak. As you self-organize, tension migrates from extremities into the core.',
  },
  {
    title: 'Internal Connections 體の統一',
    body: 'Cyan arcs show kinetic chains linking distant body parts through the core. The purple arch connects feet through hips. Stronger connections = unified structure.',
  },
  {
    title: 'Ground Path / Force Flow 地面への道',
    body: 'Animated dashes show how an external push at the shoulder travels to the ground. Red pooling = force is stuck. Green flow = force reaches the earth.',
  },
  {
    title: 'Stacking 整列',
    body: 'Dots show four landmarks (ear, shoulder, hip, ankle) relative to a plumb line. Green = aligned over ankles. Orange = off-axis. Percentage shows overall alignment.',
  },
];

let activeTooltipIndex = -1;

function showTooltip(x, y, index) {
  if (activeTooltipIndex !== index) {
    activeTooltipIndex = index;
    const content = PANEL_TOOLTIPS[index];
    tooltip.textContent = '';
    const strong = document.createElement('strong');
    strong.textContent = content.title;
    tooltip.appendChild(strong);
    tooltip.appendChild(document.createElement('br'));
    tooltip.appendChild(document.createTextNode(content.body));
    tooltip.classList.add('visible');
    tooltip.setAttribute('aria-hidden', 'false');
  }

  const pad = 12;
  let left = x + pad;
  let top = y + pad;
  if (left + 240 > window.innerWidth) left = x - 240 - pad;
  if (top + 160 > window.innerHeight) top = y - 160 - pad;
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function hideTooltip() {
  activeTooltipIndex = -1;
  tooltip.classList.remove('visible');
  tooltip.setAttribute('aria-hidden', 'true');
}

canvases.forEach((canvas, i) => {
  canvas.addEventListener('pointerenter', (e) => showTooltip(e.clientX, e.clientY, i));
  canvas.addEventListener('pointermove', (e) => showTooltip(e.clientX, e.clientY, i));
  canvas.addEventListener('pointerleave', hideTooltip);
});

// --- Accessibility: screen reader descriptions ---
let lastSrLabel = '';

function updateScreenReaderDescriptions(state) {
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
    setAutoplayState(!autoplayActive);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    setAutoplayState(false);
    slider.value = clamp(parseFloat(slider.value) + 0.02);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    setAutoplayState(false);
    slider.value = clamp(parseFloat(slider.value) - 0.02);
  } else if (e.key >= '1' && e.key <= '9') {
    const idx = parseInt(e.key) - 1;
    if (idx < scenario.keyframes.length) {
      setAutoplayState(false);
      animateSliderTo(scenario.keyframes[idx].t);
    }
  }
});

// --- Render loop ---
let startTime = performance.now();
let lastT = -1;
let lastLabelText = '';

function render(now) {
  const time = (now - startTime) / 1000;

  updateAnimatedSlider(now);
  updateAutoplay(now);

  const t = parseFloat(slider.value);
  const tChanged = t !== lastT;
  lastT = t;

  const state = tChanged ? computeState(scenario, t) : render._lastState;
  render._lastState = state;

  // Update DOM only when t changes
  if (tChanged) {
    slider.setAttribute('aria-valuenow', t.toFixed(2));

    const labelText = `${state.label} — ${state.description}`;
    if (labelText !== lastLabelText) {
      lastLabelText = labelText;
      sliderLabel.textContent = labelText;
    }

    // Update step buttons: all passed stages stay lit, current gets 'current'
    for (let i = 0; i < stepBtns.length; i++) {
      const kfT = scenario.keyframes[i].t;
      const passed = t >= kfT - 0.01;
      const current = Math.abs(t - kfT) < 0.01;
      stepBtns[i].classList.toggle('passed', passed && !current);
      stepBtns[i].classList.toggle('active', current);
      stepBtns[i].setAttribute('aria-pressed', passed || current);
    }

    updateScreenReaderDescriptions(state);
  }

  // Render panels
  for (let i = 0; i < panels.length; i++) {
    const w = canvases[i].logicalWidth;
    const h = canvases[i].logicalHeight;
    if (panels[i].usesTime || tChanged) {
      if (panels[i].usesTime) {
        panels[i].render(ctxs[i], state, w, h, time);
      } else {
        panels[i].render(ctxs[i], state, w, h);
      }
    }
  }

  requestAnimationFrame(render);
}

// --- About modal ---
const ABOUT_MD_PATH = 'docs/JibunWoTsukure_Importance.md';
const titleLink = document.getElementById('title-link');
const aboutModal = document.getElementById('about-modal');
const modalClose = document.getElementById('modal-close');
const modalBody = document.getElementById('modal-body');
let mdLoaded = false;

async function loadAboutContent() {
  if (mdLoaded) return;
  try {
    const res = await fetch(ABOUT_MD_PATH);
    const text = await res.text();
    modalBody.innerHTML = text
      .split(/\n\n+/)
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join('');
    mdLoaded = true;
  } catch {
    modalBody.innerHTML = '<p>Could not load content.</p>';
  }
}

async function openModal() {
  await loadAboutContent();
  aboutModal.classList.add('visible');
  aboutModal.setAttribute('aria-hidden', 'false');
  modalClose.focus();
}

function closeModal() {
  aboutModal.classList.remove('visible');
  aboutModal.setAttribute('aria-hidden', 'true');
  titleLink.focus();
}

titleLink.addEventListener('click', (e) => {
  e.preventDefault();
  openModal();
});

modalClose.addEventListener('click', closeModal);

aboutModal.addEventListener('click', (e) => {
  if (e.target === aboutModal) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && aboutModal.classList.contains('visible')) {
    closeModal();
  }
});

// --- Init ---
window.addEventListener('resize', resize);
resize();
buildSteps();
requestAnimationFrame(render);
