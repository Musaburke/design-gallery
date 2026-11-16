// One monotone cubic (PCHIP, Fritsch-Carlson weights) through every shot's place in the scroll. It maps scroll
// progress to a place along the camera curves, so the camera's speed never jumps at a shot: it flows through each
// one instead of easing in and out of it. Pure maths, no Three.
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

export function makeFlow(knots: number[]) {
  const n1 = knots.length - 1;
  const h = (j: number) => knots[j + 1]! - knots[j]!;
  const d = (j: number) => 1 / h(j);
  const slope = knots.map((_, k) => {
    if (k === 0) return d(0);
    if (k === n1) return d(n1 - 1);
    const w1 = 2 * h(k) + h(k - 1), w2 = h(k) + 2 * h(k - 1);
    return (w1 + w2) / (w1 / d(k - 1) + w2 / d(k));
  });
  const segment = (p: number) => { let i = 0; while (i < n1 - 1 && p >= knots[i + 1]!) i++; return i; };
  // Place along the curves, 0..1 (shot k sits at k / n1).
  return (p: number) => {
    const i = segment(p), hi = h(i), x = seg(p, knots[i]!, knots[i + 1]!), x2 = x * x, x3 = x2 * x;
    const v = (2 * x3 - 3 * x2 + 1) * i + (x3 - 2 * x2 + x) * hi * slope[i]! + (-2 * x3 + 3 * x2) * (i + 1) + (x3 - x2) * hi * slope[i + 1]!;
    return clamp(v / n1);
  };
}

// A critically damped spring (smoothDamp): the camera eases into a scroll instead of jumping to full speed.
export function spring(smooth: number) {
  let x = 0, v = 0;
  return {
    set: (to: number) => { x = to; v = 0; },
    step: (to: number, dt: number) => {
      const w = 2 / smooth, k = w * dt, e = 1 / (1 + k + 0.48 * k * k + 0.235 * k * k * k);
      const ch = x - to, tmp = (v + w * ch) * dt;
      v = (v - w * tmp) * e; x = to + (ch + tmp) * e;
      if (Math.abs(to - x) < 1e-5 && Math.abs(v) < 1e-4) { x = to; v = 0; }
      return x;
    },
    get moving() { return v !== 0; },
  };
}
