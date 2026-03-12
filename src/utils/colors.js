// --- Color palette (3Blue1Brown-esque dark theme) ---

export const COLORS = {
  bg: '#1a1a2e',
  panel: '#16213e',
  panelBorder: '#0f3460',
  bone: '#c8d6e5',
  boneDim: '#576574',
  node: '#dfe6e9',
  text: '#dfe6e9',
  textDim: '#636e72',
  label: '#74b9ff',

  // Tension heatmap
  heatHot: [255, 60, 40],   // parasitic tension
  heatWarm: [255, 165, 0],
  heatCool: [40, 120, 200],  // efficient / resolved

  // Connection lines
  connectionGlow: '#00cec9',
  connectionDim: '#2d3436',

  // Force flow
  forceArrow: '#fdcb6e',
  forceBlocked: '#d63031',
  forceFlowing: '#00b894',

  // Stacking
  plumbLine: '#636e72',
  landmarkAligned: '#55efc4',
  landmarkOff: '#e17055',

  // Accent
  accent: '#e056fd',
  sliderTrack: '#2d3436',
  sliderThumb: '#74b9ff',
};

export function heatColor(t) {
  // t: 0 = cool/resolved, 1 = hot/tense
  const hot = COLORS.heatHot;
  const cool = COLORS.heatCool;
  const r = Math.round(cool[0] + (hot[0] - cool[0]) * t);
  const g = Math.round(cool[1] + (hot[1] - cool[1]) * t);
  const b = Math.round(cool[2] + (hot[2] - cool[2]) * t);
  return `rgb(${r},${g},${b})`;
}

export function heatColorAlpha(t, alpha) {
  const hot = COLORS.heatHot;
  const cool = COLORS.heatCool;
  const r = Math.round(cool[0] + (hot[0] - cool[0]) * t);
  const g = Math.round(cool[1] + (hot[1] - cool[1]) * t);
  const b = Math.round(cool[2] + (hot[2] - cool[2]) * t);
  return `rgba(${r},${g},${b},${alpha})`;
}
