// A made-up notes graph in the shape Obsidian's graph view draws: a few folders, each a
// loose cluster, with most links inside a folder and a few across. Seeded, so every build
// draws the same picture, and laid out once at build time with a small force simulation.

export interface Graph {
  width: number; height: number;
  nodes: { x: number; y: number; r: number; g: number }[];
  edges: [number, number][];
  folders: string[];
}

export function makeGraph(seed = 7): Graph {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const width = 640, height = 400; // the space the layout runs in
  const folders = ['Projects', 'Ideas', 'Reading', 'Daily'];
  const sizes = [22, 16, 18, 12];
  const centres = [[230, 190], [430, 140], [440, 290], [150, 320]];

  const g: number[] = [];
  sizes.forEach((n, f) => { for (let i = 0; i < n; i++) g.push(f); });
  const pos = g.map((f) => ({ x: centres[f]![0]! + (rand() - 0.5) * 140, y: centres[f]![1]! + (rand() - 0.5) * 110, vx: 0, vy: 0 }));

  // Each note links to one or two earlier notes in its folder; one in six also links across.
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  const add = (a: number, b: number) => {
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (a !== b && !seen.has(k)) { seen.add(k); edges.push([a, b]); }
  };
  g.forEach((f, i) => {
    const mates = g.map((h, j) => (h === f && j < i ? j : -1)).filter((j) => j >= 0);
    if (mates.length) add(i, mates[Math.floor(rand() * mates.length)]!);
    if (mates.length > 2 && rand() < 0.6) add(i, mates[Math.floor(rand() * mates.length)]!);
    if (rand() < 0.17) add(i, Math.floor(rand() * g.length));
  });

  // Springs on links, repulsion between notes, a pull toward each folder's centre.
  for (let step = 0; step < 300; step++) {
    for (let a = 0; a < pos.length; a++) for (let b = a + 1; b < pos.length; b++) {
      const dx = pos[b]!.x - pos[a]!.x, dy = pos[b]!.y - pos[a]!.y;
      const d2 = Math.max(dx * dx + dy * dy, 25), f = 260 / d2;
      const d = Math.sqrt(d2);
      pos[a]!.vx -= (dx / d) * f; pos[a]!.vy -= (dy / d) * f;
      pos[b]!.vx += (dx / d) * f; pos[b]!.vy += (dy / d) * f;
    }
    for (const [a, b] of edges) {
      const dx = pos[b]!.x - pos[a]!.x, dy = pos[b]!.y - pos[a]!.y;
      const d = Math.hypot(dx, dy) || 1, f = (d - 34) * 0.02;
      pos[a]!.vx += (dx / d) * f; pos[a]!.vy += (dy / d) * f;
      pos[b]!.vx -= (dx / d) * f; pos[b]!.vy -= (dy / d) * f;
    }
    pos.forEach((p, i) => {
      const [cx, cy] = centres[g[i]!]!;
      p.vx += (cx! - p.x) * 0.004; p.vy += (cy! - p.y) * 0.004;
      p.vx *= 0.82; p.vy *= 0.82;
      p.x = Math.min(width - 16, Math.max(16, p.x + p.vx));
      p.y = Math.min(height - 16, Math.max(16, p.y + p.vy));
    });
  }

  const degree = g.map(() => 0);
  edges.forEach(([a, b]) => { degree[a]!++; degree[b]!++; });
  // Crop the drawing to the notes, with room for them to drift and be dragged.
  const pad = 24;
  const minX = Math.min(...pos.map((p) => p.x)) - pad, minY = Math.min(...pos.map((p) => p.y)) - pad;
  pos.forEach((p) => { p.x -= minX; p.y -= minY; });
  return {
    width: Math.round(Math.max(...pos.map((p) => p.x)) + pad), height: Math.round(Math.max(...pos.map((p) => p.y)) + pad), folders, edges,
    nodes: pos.map((p, i) => ({ x: +p.x.toFixed(1), y: +p.y.toFixed(1), r: +(3 + Math.sqrt(degree[i]!) * 1.6).toFixed(1), g: g[i]! })),
  };
}
