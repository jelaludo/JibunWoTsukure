// --- Bootstrap: create canvases, wire controls, rAF loop ---

import { computeState } from './state.js';
import { standing } from './scenarios/standing.js';
import { renderTensionHeatmap } from './panels/tensionHeatmap.js';
import { renderConnectionLines } from './panels/connectionLines.js';
import { renderForceFlow } from './panels/forceFlow.js';
import { renderStacking } from './panels/stackingAlignment.js';

const scenario = standing;

// --- DOM refs ---
const slider = document.getElementById('slider');
const sliderLabel = document.getElementById('slider-label');
const stepsContainer = document.getElementById('steps');
const canvases = [
  document.getElementById('canvas-tension'),
  document.getElementById('canvas-connections'),
  document.getElementById('canvas-force'),
  document.getElementById('canvas-stacking'),
];
const ctxs = canvases.map(c => c.getContext('2d'));

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
    // Store logical size
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
    btn.addEventListener('click', () => {
      animateSliderTo(kf.t);
    });
    stepsContainer.appendChild(btn);
  }
}

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
  // Ease in-out
  const eased = progress * progress * (3 - 2 * progress);
  const value = animFrom + (animTarget - animFrom) * eased;
  slider.value = value;
  if (progress >= 1) {
    animTarget = null;
  }
}

// --- Render loop ---
let startTime = performance.now();

function render(now) {
  const time = (now - startTime) / 1000;

  updateAnimatedSlider(now);

  const t = parseFloat(slider.value);
  const state = computeState(scenario, t);

  // Update label
  sliderLabel.textContent = `${state.label} — ${state.description}`;

  // Update step button active state
  const stepBtns = stepsContainer.querySelectorAll('.step-btn');
  stepBtns.forEach((btn, i) => {
    const kfT = scenario.keyframes[i].t;
    btn.classList.toggle('active', Math.abs(t - kfT) < 0.01);
  });

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
