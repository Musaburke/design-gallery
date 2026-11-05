// A wireframe network globe. Points spread evenly on a sphere (Fibonacci),
// each joined to its nearest neighbours. Turns slowly, tilts toward the cursor,
// and brightens on the starfield's heartbeat.
import * as THREE from 'three';
import { createStage, heartbeat, trackPointer } from '../../lib/stage';

export function mountGlobe(canvas: HTMLCanvasElement) {
  const stage = createStage(canvas, 38);
  if (!stage) return;
  const { scene, camera, run } = stage;
  camera.position.set(0, 0, 6.2);

  const COUNT = canvas.clientWidth < 700 ? 150 : 230;
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    // A little jitter so it reads as a network, not a perfect lattice.
    const j = 1 + (Math.random() - 0.5) * 0.12;
    pts.push(new THREE.Vector3(Math.cos(th) * r * j, y * j, Math.sin(th) * r * j).multiplyScalar(1.9));
  }

  // Join each point to its 3 nearest neighbours (deduplicated).
  const pairs = new Set<string>();
  const linePos: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const near = pts
      .map((p, k) => ({ k, d: p.distanceToSquared(pts[i]) }))
      .filter((n) => n.k !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    for (const { k } of near) {
      const key = i < k ? `${i}-${k}` : `${k}-${i}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      linePos.push(pts[i].x, pts[i].y, pts[i].z, pts[k].x, pts[k].y, pts[k].z);
    }
  }

  const group = new THREE.Group();
  scene.add(group);

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0x9fd09c, transparent: true, opacity: 0.32, depthWrite: false });
  group.add(new THREE.LineSegments(lineGeo, lineMat));

  // Round, soft points from a tiny canvas sprite.
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const g = sprite.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(244,239,228,1)');
  grad.addColorStop(0.35, 'rgba(244,239,228,0.6)');
  grad.addColorStop(1, 'rgba(244,239,228,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const pointGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const pointMat = new THREE.PointsMaterial({
    size: 0.09, map: new THREE.CanvasTexture(sprite), transparent: true, depthWrite: false, opacity: 0.9,
  });
  group.add(new THREE.Points(pointGeo, pointMat));

  // Faint inner sphere wireframe for depth.
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.2, 2),
    new THREE.MeshBasicMaterial({ color: 0xf1f1ef, wireframe: true, transparent: true, opacity: 0.05 })
  );
  group.add(shell);

  const pointer = trackPointer();
  let tx = 0, ty = 0;
  group.rotation.x = 0.35;

  run((t) => {
    tx += (pointer.y * 0.35 - tx) * 0.04;
    ty += (pointer.x * 0.5 - ty) * 0.04;
    group.rotation.y = t * 0.00009 + ty;
    group.rotation.x = 0.35 + tx;
    shell.rotation.y = -t * 0.00015;
    const b = heartbeat();
    lineMat.opacity = 0.26 + b * 0.22;
    pointMat.size = 0.085 + b * 0.035;
    const s = 1 + b * 0.015;
    group.scale.set(s, s, s);
  });
}
