const clamp01 = value => Math.max(0, Math.min(1, value));
const mix = (a, b, t) => a + (b - a) * t;

// Percent coordinates in the stage. The line between the start and end gives
// depth perspective. Gravity lifts the projected path above that line.
export function footballAt(from, to, elapsed, { arc, spin, drag, rolling }) {
  const t = clamp01(elapsed);
  const p = drag ? Math.expm1(-drag * t) / Math.expm1(-drag) : t;
  const velocityX = (to.x - from.x) * (drag ? drag * Math.exp(-drag * t) / -Math.expm1(-drag) : 1);
  const velocityY = to.y - from.y - (rolling ? 0 : 4 * arc * (1 - 2 * t));
  const lift = rolling ? 0 : 4 * arc * t * (1 - t);

  return {
    x: mix(from.x, to.x, p),
    y: mix(from.y, to.y, t) - lift,
    floor: mix(from.floor, to.floor, p),
    lift,
    scale: mix(from.scale, to.scale, p),
    angle: from.angle + spin * p,
    velocityX,
    velocityY
  };
}

// The net has four fixed corners. Each point responds to a local impulse that
// travels across the mesh and damps out while the frame stays in place.
const NET_CORNERS = [[47, 39], [324, 23], [346, 208], [22, 216]];

export function netPoint(u, v) {
  const [a, b, c, d] = NET_CORNERS;
  return { x: mix(mix(a[0], b[0], u), mix(d[0], c[0], u), v),
    y: mix(mix(a[1], b[1], u), mix(d[1], c[1], u), v) };
}

export function netMesh(t = 0, hitU = .5, hitV = .5, power = 0) {
  const cols = 18;
  const rows = 12;
  const points = [];
  for (let row = 0; row <= rows; row++) {
    const line = [];
    const v = row / rows;
    for (let col = 0; col <= cols; col++) {
      const u = col / cols;
      const { x, y } = netPoint(u, v);
      const distance = Math.hypot(u - hitU, v - hitV);
      const passed = Math.max(0, t - distance * .19);
      const boundary = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      const wave = Math.sin(passed * 24) * Math.exp(-passed * 6.5 - distance * 3.1) * boundary * power;
      line.push((x + wave).toFixed(1) + ' ' + (y + wave * .36).toFixed(1));
    }
    points.push(line);
  }
  let path = '';
  for (const line of points) path += 'M' + line.join('L');
  for (let col = 0; col <= cols; col++) path += 'M' + points.map(line => line[col]).join('L');
  return path;
}
