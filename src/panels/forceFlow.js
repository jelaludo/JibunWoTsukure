// --- Panel 3: Force Flow / Ground Path ---
// External push at shoulder, animated force flowing through body.

import { FORCE_PATH, scalePositions, drawMannequin, MIDPOINTS } from '../mannequin.js';
import { COLORS } from '../utils/colors.js';
import { clearPanel, drawPanelTitle, drawArrow, drawCircle } from '../utils/drawing.js';
import { lerp } from '../utils/math.js';

export function renderForceFlow(ctx, state, w, h, time) {
  clearPanel(ctx, w, h);
  drawPanelTitle(ctx, 'Ground Path / Force Flow', '地面への道', w);

  const positions = scalePositions(state.positions, w, h);

  // Draw mannequin dimly
  drawMannequin(ctx, positions, {
    boneColor: COLORS.boneDim + '50',
    nodeColor: COLORS.node + '30',
    nodeRadius: 2,
  });

  const efficiency = state.forceEfficiency;
  const accum = state.forceAccumulation;

  // Draw incoming force arrow (push from outside, right side)
  const shoulderR = positions.shoulderR;
  if (!shoulderR) return;

  const pushStart = { x: shoulderR.x + 50, y: shoulderR.y - 10 };
  drawArrow(ctx, pushStart, shoulderR, COLORS.forceArrow, 2.5, 10);

  // Draw force path segments
  for (let i = 0; i < FORCE_PATH.length - 1; i++) {
    const fromName = FORCE_PATH[i];
    const toName = FORCE_PATH[i + 1];

    let fromPos = positions[fromName];
    let toPos = positions[toName];
    if (!fromPos || !toPos) continue;

    const fromAccum = accum[fromName] ?? 0;
    const toAccum = accum[toName] ?? 0;
    const segFlow = (fromAccum + toAccum) / 2;

    // Color: red where blocked, green where flowing
    const flowColor = segFlow > 0.1
      ? lerpColor(COLORS.forceBlocked, COLORS.forceFlowing, efficiency)
      : COLORS.boneDim + '40';

    // Animated dashes along the path
    const dashOffset = time * 60 * efficiency;
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -dashOffset;
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.lineTo(toPos.x, toPos.y);
    ctx.strokeStyle = flowColor;
    ctx.lineWidth = 1.5 + segFlow * 2.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Accumulation glow at node (force pooling = red)
    if (fromAccum > 0.2) {
      const blocked = fromAccum * (1 - efficiency);
      if (blocked > 0.1) {
        const grad = ctx.createRadialGradient(fromPos.x, fromPos.y, 0, fromPos.x, fromPos.y, 12 + blocked * 15);
        grad.addColorStop(0, `rgba(214, 48, 49, ${blocked * 0.5})`);
        grad.addColorStop(1, 'rgba(214, 48, 49, 0)');
        ctx.beginPath();
        ctx.arc(fromPos.x, fromPos.y, 12 + blocked * 15, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }
  }

  // Ground termination indicator
  const lastNode = FORCE_PATH[FORCE_PATH.length - 1];
  const lastPos = positions[lastNode];
  if (lastPos) {
    const groundFlow = accum[lastNode] ?? 0;
    if (groundFlow > 0.1) {
      // Arrow into ground
      const groundPt = { x: lastPos.x, y: lastPos.y + 20 };
      drawArrow(ctx, lastPos, groundPt, COLORS.forceFlowing + Math.round(groundFlow * 200).toString(16).padStart(2, '0'), 2, 8);

      // Ground line
      ctx.beginPath();
      ctx.moveTo(lastPos.x - 20, groundPt.y + 4);
      ctx.lineTo(lastPos.x + 20, groundPt.y + 4);
      ctx.strokeStyle = COLORS.forceFlowing + '60';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
  ];
}
