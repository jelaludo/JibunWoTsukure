// --- Panel 1: Tension Economy Heatmap ---
// Heat overlays per body region. Hot = parasitic tension.

import { REGIONS, scalePositions, drawMannequin } from '../mannequin.js';
import { COLORS, heatColorAlpha } from '../utils/colors.js';
import { clearPanel, drawPanelTitle } from '../utils/drawing.js';

const REGION_RADIUS = {
  head: 22,
  neck: 16,
  shoulders: 28,
  arms: 20,
  upperBack: 24,
  core: 30,
  hips: 26,
  legs: 22,
};

export function renderTensionHeatmap(ctx, state, w, h) {
  clearPanel(ctx, w, h);
  drawPanelTitle(ctx, 'Tension Economy', '無駄を省く', w);

  const positions = scalePositions(state.positions, w, h);

  // Draw heat overlays per region
  for (const [region, nodeNames] of Object.entries(REGIONS)) {
    const tension = state.tension[region] ?? 0;
    const radius = REGION_RADIUS[region] || 20;

    for (const nodeName of nodeNames) {
      const pos = positions[nodeName];
      if (!pos) continue;

      // Radial gradient: hot center fading out
      const r = radius + tension * 15;
      const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r);
      grad.addColorStop(0, heatColorAlpha(tension, 0.5 + tension * 0.3));
      grad.addColorStop(0.6, heatColorAlpha(tension, 0.2 * tension));
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // Draw mannequin on top
  drawMannequin(ctx, positions, { boneColor: COLORS.bone + '90', nodeRadius: 2.5 });
}
