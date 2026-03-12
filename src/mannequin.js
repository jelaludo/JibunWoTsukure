// --- Body topology: nodes and bone edges ---
// All positions are in a normalized coordinate system (0-1),
// scaled to canvas size at draw time.

export const NODES = [
  'head', 'neck',
  'shoulderL', 'shoulderR', 'shoulderMid',
  'elbowL', 'elbowR',
  'handL', 'handR',
  'spine', 'core',
  'hipL', 'hipR', 'hipMid',
  'kneeL', 'kneeR',
  'ankleL', 'ankleR', 'ankleMid',
];

export const BONES = [
  ['head', 'neck'],
  ['neck', 'shoulderL'],
  ['neck', 'shoulderR'],
  ['shoulderL', 'elbowL'],
  ['shoulderR', 'elbowR'],
  ['elbowL', 'handL'],
  ['elbowR', 'handR'],
  ['neck', 'spine'],
  ['spine', 'core'],
  ['core', 'hipL'],
  ['core', 'hipR'],
  ['hipL', 'kneeL'],
  ['hipR', 'kneeR'],
  ['kneeL', 'ankleL'],
  ['kneeR', 'ankleR'],
];

// Virtual midpoints (computed, not in skeleton)
export const MIDPOINTS = {
  shoulderMid: ['shoulderL', 'shoulderR'],
  hipMid: ['hipL', 'hipR'],
  ankleMid: ['ankleL', 'ankleR'],
};

// Body regions for tension heatmap — each maps to a list of nodes
export const REGIONS = {
  head: ['head'],
  neck: ['neck'],
  shoulders: ['shoulderL', 'shoulderR'],
  arms: ['elbowL', 'elbowR', 'handL', 'handR'],
  upperBack: ['spine'],
  core: ['core'],
  hips: ['hipL', 'hipR'],
  legs: ['kneeL', 'kneeR', 'ankleL', 'ankleR'],
};

// Connection pairs for Panel 2
export const CONNECTION_PAIRS = [
  // Diagonal kinetic chains
  { from: 'shoulderL', to: 'hipR', label: 'L shoulder→R hip' },
  { from: 'shoulderR', to: 'hipL', label: 'R shoulder→L hip' },
  // Elbow-knee magnets
  { from: 'elbowL', to: 'kneeL', label: 'L elbow→L knee' },
  { from: 'elbowR', to: 'kneeR', label: 'R elbow→R knee' },
  // Arm-arm
  { from: 'handL', to: 'handR', label: 'hand↔hand' },
  // Shoulder-hip bilateral
  { from: 'shoulderL', to: 'hipL', label: 'L column' },
  { from: 'shoulderR', to: 'hipR', label: 'R column' },
  // Core to ground
  { from: 'core', to: 'ankleMid', label: 'core→ground' },
];

// The Arch: foot→knee→hip→hip→knee→foot — a foundational lower-body connection
export const ARCH_PATH = ['ankleL', 'kneeL', 'hipL', 'hipR', 'kneeR', 'ankleR'];

// Force path: ordered node chain for Panel 3 (shoulder push scenario)
export const FORCE_PATH = [
  'shoulderR', 'neck', 'spine', 'core', 'hipR', 'kneeR', 'ankleR'
];

// Landmark nodes for Panel 4 (stacking)
export const LANDMARKS = ['head', 'shoulderMid', 'hipMid', 'ankleMid'];

import { COLORS } from './utils/colors.js';
import { drawLine, drawCircle } from './utils/drawing.js';

/**
 * Scale normalized positions to canvas pixel coordinates.
 * Leaves margin for panel titles and padding.
 */
export function scalePositions(positions, w, h) {
  const margin = { top: 60, bottom: 20, left: 40, right: 40 };
  const drawW = w - margin.left - margin.right;
  const drawH = h - margin.top - margin.bottom;
  const scaled = {};
  for (const [key, pos] of Object.entries(positions)) {
    scaled[key] = {
      x: margin.left + pos.x * drawW,
      y: margin.top + pos.y * drawH,
    };
  }
  // Compute midpoints
  for (const [mid, [a, b]] of Object.entries(MIDPOINTS)) {
    if (scaled[a] && scaled[b]) {
      scaled[mid] = {
        x: (scaled[a].x + scaled[b].x) / 2,
        y: (scaled[a].y + scaled[b].y) / 2,
      };
    }
  }
  return scaled;
}

/**
 * Draw the stick-figure mannequin.
 */
export function drawMannequin(ctx, positions, opts = {}) {
  const boneColor = opts.boneColor || COLORS.boneDim;
  const nodeColor = opts.nodeColor || COLORS.node;
  const boneWidth = opts.boneWidth || 2;
  const nodeRadius = opts.nodeRadius || 3;
  const showNodes = opts.showNodes !== false;

  // Draw bones
  for (const [a, b] of BONES) {
    if (positions[a] && positions[b]) {
      drawLine(ctx, positions[a], positions[b], boneColor, boneWidth);
    }
  }

  // Draw nodes
  if (showNodes) {
    for (const name of NODES) {
      if (positions[name] && !Object.keys(MIDPOINTS).includes(name)) {
        drawCircle(ctx, positions[name], nodeRadius, nodeColor);
      }
    }
  }
}
