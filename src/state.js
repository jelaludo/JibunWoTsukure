// --- Shared body state model + keyframe interpolation ---

import { lerp, lerpPos, clamp } from './utils/math.js';

/**
 * Given a scenario and a t value (0–1), compute the interpolated state.
 * Finds the two surrounding keyframes and lerps all fields.
 */
export function computeState(scenario, t) {
  t = clamp(t);
  const kfs = scenario.keyframes;

  // Find bounding keyframes
  let lo = kfs[0], hi = kfs[kfs.length - 1];
  for (let i = 0; i < kfs.length - 1; i++) {
    if (t >= kfs[i].t && t <= kfs[i + 1].t) {
      lo = kfs[i];
      hi = kfs[i + 1];
      break;
    }
  }

  // Local t within segment
  const segLen = hi.t - lo.t;
  const lt = segLen === 0 ? 0 : (t - lo.t) / segLen;

  return {
    t,
    label: lt < 0.5 ? lo.label : hi.label,
    description: lt < 0.5 ? lo.description : hi.description,
    positions: lerpPositions(lo.positions, hi.positions, lt),
    tension: lerpObject(lo.tension, hi.tension, lt),
    connections: lerpObject(lo.connections, hi.connections, lt),
    forceEfficiency: lerp(lo.forceEfficiency, hi.forceEfficiency, lt),
    forceAccumulation: lerpObject(lo.forceAccumulation, hi.forceAccumulation, lt),
  };
}

function lerpPositions(a, b, t) {
  const result = {};
  for (const key of Object.keys(a)) {
    result[key] = lerpPos(a[key], b[key], t);
  }
  return result;
}

function lerpObject(a, b, t) {
  const result = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    result[key] = lerp(a[key] ?? 0, b[key] ?? 0, t);
  }
  return result;
}
