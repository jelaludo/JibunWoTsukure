// --- Panel 2: Internal Connection Lines ---
// Bezier arcs between distant body parts, routed through core.
// Plus the Arch: foot→knee→hip→hip→knee→foot.

import { CONNECTION_PAIRS, ARCH_PATH, scalePositions, drawMannequin } from '../mannequin.js';
import { COLORS } from '../utils/colors.js';
import { clearPanel, drawPanelTitle } from '../utils/drawing.js';

export function renderConnectionLines(ctx, state, w, h, time) {
  clearPanel(ctx, w, h);
  drawPanelTitle(ctx, 'Internal Connections', '体の統一', w);

  const positions = scalePositions(state.positions, w, h);

  // Draw mannequin dimly
  drawMannequin(ctx, positions, {
    boneColor: COLORS.boneDim + '60',
    nodeColor: COLORS.node + '40',
    nodeRadius: 2,
  });

  const corePos = positions.core;
  if (!corePos) return;

  // --- Draw the Arch (foot→knee→hip→hip→knee→foot) ---
  const archStrength = state.connections['arch'] ?? 0;
  if (archStrength > 0.02) {
    drawArch(ctx, positions, archStrength, time);
  }

  // --- Draw pairwise connection arcs ---
  for (const pair of CONNECTION_PAIRS) {
    const fromPos = positions[pair.from];
    const toPos = positions[pair.to];
    if (!fromPos || !toPos) continue;

    const key = `${pair.from}-${pair.to}`;
    const strength = state.connections[key] ?? 0;

    if (strength < 0.02) continue;

    // Bezier control point: pull toward core
    const cpx = corePos.x + (fromPos.x + toPos.x - 2 * corePos.x) * 0.3;
    const cpy = corePos.y + (fromPos.y + toPos.y - 2 * corePos.y) * 0.3;

    // Pulsing effect when strong
    const pulse = strength > 0.5
      ? 1 + 0.15 * Math.sin(time * 3 + strength * 10)
      : 1;

    const alpha = strength * 0.8 * pulse;
    const width = 1 + strength * 3;

    // Glow layer
    if (strength > 0.3) {
      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.quadraticCurveTo(cpx, cpy, toPos.x, toPos.y);
      ctx.strokeStyle = COLORS.connectionGlow + Math.round(alpha * 0.3 * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = width + 4;
      ctx.stroke();
    }

    // Main arc
    ctx.beginPath();
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.quadraticCurveTo(cpx, cpy, toPos.x, toPos.y);
    ctx.strokeStyle = COLORS.connectionGlow + Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = width;
    ctx.stroke();

    // Connection endpoint dots
    const dotAlpha = Math.round(strength * 200).toString(16).padStart(2, '0');
    ctx.beginPath();
    ctx.arc(fromPos.x, fromPos.y, 3 + strength * 2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.connectionGlow + dotAlpha;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(toPos.x, toPos.y, 3 + strength * 2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.connectionGlow + dotAlpha;
    ctx.fill();
  }
}

/**
 * Draw the lower-body arch as a smooth upward-bowing curve
 * through ankleL → kneeL → hipL → hipR → kneeR → ankleR.
 *
 * The arch bows forward (toward the viewer / away from the body),
 * giving it that bridge/keystone feel.
 */
function drawArch(ctx, positions, strength, time) {
  const pts = ARCH_PATH.map(name => positions[name]).filter(Boolean);
  if (pts.length < 4) return;

  // Pulse when strong
  const pulse = strength > 0.5
    ? 1 + 0.1 * Math.sin(time * 2.5)
    : 1;

  const alpha = strength * 0.85 * pulse;
  const width = 1.5 + strength * 3;

  // Use a Catmull-Rom-style approach: draw a smooth curve through all arch points,
  // with the hips (top of the arch) pushed slightly forward (lower y = higher on screen)
  // to emphasize the arch shape.

  // Offset hip points upward to create the arch crown
  const archPts = pts.map((p, i) => {
    // Indices 2,3 are hipL, hipR — pull them up to crown the arch
    if (i === 2 || i === 3) {
      return { x: p.x, y: p.y - strength * 12 };
    }
    return p;
  });

  // Outer glow
  if (strength > 0.3) {
    ctx.beginPath();
    drawSmoothCurve(ctx, archPts);
    ctx.strokeStyle = '#e056fd' + Math.round(alpha * 0.25 * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = width + 6;
    ctx.stroke();
  }

  // Main arch stroke
  ctx.beginPath();
  drawSmoothCurve(ctx, archPts);
  ctx.strokeStyle = '#e056fd' + Math.round(alpha * 255).toString(16).padStart(2, '0');
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Node dots along the arch
  const dotAlpha = Math.round(strength * 220).toString(16).padStart(2, '0');
  for (const pt of pts) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 3 + strength * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#e056fd' + dotAlpha;
    ctx.fill();
  }

  // "Arch" label at the crown when visible enough
  if (strength > 0.4) {
    const midX = (archPts[2].x + archPts[3].x) / 2;
    const midY = (archPts[2].y + archPts[3].y) / 2 - 14;
    ctx.font = '10px "IBM Plex Sans", sans-serif';
    ctx.fillStyle = '#e056fd' + Math.round(alpha * 200).toString(16).padStart(2, '0');
    ctx.textAlign = 'center';
    ctx.fillText('arch', midX, midY);
  }
}

/**
 * Draw a smooth curve through an array of points using
 * quadratic bezier segments with averaged control points.
 */
function drawSmoothCurve(ctx, pts) {
  if (pts.length < 2) return;

  ctx.moveTo(pts[0].x, pts[0].y);

  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
    return;
  }

  // First segment: quadratic to midpoint of first two
  const mid01x = (pts[0].x + pts[1].x) / 2;
  const mid01y = (pts[0].y + pts[1].y) / 2;
  ctx.quadraticCurveTo(pts[0].x, pts[0].y, mid01x, mid01y);

  // Middle segments: smooth quadratics through each point
  for (let i = 1; i < pts.length - 1; i++) {
    const midx = (pts[i].x + pts[i + 1].x) / 2;
    const midy = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midx, midy);
  }

  // Last segment: finish at the last point
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
}
