// --- Panel 4: Stacking / Alignment Geometry ---
// Four landmark dots + plumb line. Simplest panel.

import { LANDMARKS, MIDPOINTS, scalePositions } from '../mannequin.js';
import { COLORS } from '../utils/colors.js';
import { clearPanel, drawCircle, drawDashedLine, drawLine, drawPanelTitle, drawLabel } from '../utils/drawing.js';
import { lerp, dist } from '../utils/math.js';

const LANDMARK_LABELS = ['Ear', 'Shoulder', 'Hip', 'Ankle'];

export function renderStacking(ctx, state, w, h) {
  clearPanel(ctx, w, h);
  drawPanelTitle(ctx, 'Stacking', '整列', w);

  const positions = scalePositions(state.positions, w, h);

  // Plumb line: vertical from ankle midpoint
  const ankleMid = positions.ankleMid;
  if (!ankleMid) return;

  const plumbTop = { x: ankleMid.x, y: 55 };
  const plumbBot = { x: ankleMid.x, y: h - 10 };
  drawDashedLine(ctx, plumbTop, plumbBot, COLORS.plumbLine, 1, [6, 4]);

  // Landmark positions
  const landmarkPositions = LANDMARKS.map(name => positions[name]);

  // Draw landmarks
  landmarkPositions.forEach((pos, i) => {
    if (!pos) return;

    // Deviation from plumb line
    const deviation = Math.abs(pos.x - ankleMid.x);
    const maxDeviation = w * 0.15;
    const normalizedDev = Math.min(deviation / maxDeviation, 1);

    // Color: green when aligned, orange when off
    const r = Math.round(lerp(85, 225, normalizedDev));  // 55efc4 → e17055
    const g = Math.round(lerp(239, 112, normalizedDev));
    const b = Math.round(lerp(196, 85, normalizedDev));
    const color = `rgb(${r},${g},${b})`;

    // Draw connecting line to plumb
    if (normalizedDev > 0.05) {
      drawLine(ctx, pos, { x: ankleMid.x, y: pos.y }, color + '60', 1);
    }

    // Dot
    const radius = 6 + normalizedDev * 4;
    drawCircle(ctx, pos, radius, color);

    // Label
    drawLabel(ctx, LANDMARK_LABELS[i], pos.x + (pos.x > w / 2 ? 30 : -30), pos.y + 4, 11, COLORS.textDim);
  });

  // Draw vertical alignment score
  let totalDev = 0;
  landmarkPositions.forEach(pos => {
    if (pos) totalDev += Math.abs(pos.x - ankleMid.x);
  });
  const maxTotal = w * 0.15 * 4;
  const alignScore = Math.round((1 - Math.min(totalDev / maxTotal, 1)) * 100);

  drawLabel(ctx, `${alignScore}%`, w / 2, h - 8, 12, COLORS.textDim);
}
