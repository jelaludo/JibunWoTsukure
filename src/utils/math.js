// --- Math utilities ---

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

export function inverseLerp(a, b, v) {
  return (v - a) / (b - a);
}

export function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

export function easeOut(t) {
  return 1 - (1 - t) * (1 - t);
}

export function dist(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerpPos(a, b, t) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}
