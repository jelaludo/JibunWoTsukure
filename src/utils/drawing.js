// --- Shared canvas drawing helpers ---

import { COLORS } from './colors.js';

export function clearPanel(ctx, w, h) {
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, w, h);
}

export function drawLine(ctx, a, b, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function drawCircle(ctx, pos, radius, color) {
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawGlow(ctx, pos, radius, color, alpha = 0.5) {
  const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
  grad.addColorStop(0, color.replace(')', `,${alpha})`).replace('rgb', 'rgba'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

export function drawRadialGradient(ctx, pos, innerR, outerR, colorInner, colorOuter) {
  const grad = ctx.createRadialGradient(pos.x, pos.y, innerR, pos.x, pos.y, outerR);
  grad.addColorStop(0, colorInner);
  grad.addColorStop(1, colorOuter);
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, outerR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

export function drawArrow(ctx, from, to, color, width = 2, headSize = 8) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headSize * Math.cos(angle - Math.PI / 6),
    to.y - headSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    to.x - headSize * Math.cos(angle + Math.PI / 6),
    to.y - headSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawLabel(ctx, text, x, y, fontSize = 14, color = COLORS.text) {
  ctx.font = `${fontSize}px "IBM Plex Sans", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

export function drawPanelTitle(ctx, title, subtitle, w) {
  ctx.font = '15px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = COLORS.label;
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, 28);
  if (subtitle) {
    ctx.font = '12px "IBM Plex Sans", sans-serif';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(subtitle, w / 2, 46);
  }
}

export function drawDashedLine(ctx, a, b, color, width = 1, dash = [4, 4]) {
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.setLineDash([]);
}
