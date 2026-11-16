// A scroll-driven camera: scrolling the box moves the camera through framed shots around a small model, along
// Catmull-Rom curves for position, target and lens, timed by one monotone cubic and smoothed by a spring.
// The model is a cluster of sculpted keycaps on a walnut plate, built in code.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStage, reduceMotion } from '../../lib/stage';
import { makeFlow, spring } from './flow';

// Each shot: where the camera is, what it looks at, its lens, and where in the scroll (0..1) it is reached.
const SHOTS = [
  { t: 0,    pos: [5.2, 4.6, 6.4],  target: [0, 0.2, 0],   fov: 34 }, // wide, high three-quarter
  { t: 0.34, pos: [1.6, 1.5, 2.6],  target: [0, 0.45, 0],  fov: 30 }, // close on the gold key
  { t: 0.68, pos: [-4.4, 0.9, 1.4], target: [0, 0.35, 0],  fov: 28 }, // low, from the side
  { t: 1,    pos: [0.4, 7.4, 0.9],  target: [0, 0.2, 0],   fov: 30 }, // straight down
];

function legend(ch: string) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!; g.fillStyle = '#2a2219'; g.font = '500 128px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(ch, 128, 136);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function mountScrollCamera(canvas: HTMLCanvasElement, scroller: HTMLElement) {
  const stage = createStage(canvas, 34);
  if (!stage) return;
  const { renderer, scene, camera } = stage;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;

  const key = new THREE.DirectionalLight(0xffd9a8, 2.4); key.position.set(-4, 7, 3); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = key.shadow.camera.bottom = -4; key.shadow.camera.right = key.shadow.camera.top = 4; key.shadow.radius = 6;
  scene.add(key, new THREE.HemisphereLight(0x5a4a3a, 0x0c0a08, 0.5));

  const plate = new THREE.Mesh(new RoundedBoxGeometry(4.6, 0.4, 3.2, 4, 0.12), new THREE.MeshPhysicalMaterial({ color: 0x3b2618, roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.35 }));
  plate.position.y = -0.2; plate.receiveShadow = true; scene.add(plate);
  scene.fog = new THREE.Fog(0x0e0c0a, 8, 16); // the floor melts into the background instead of ending at a horizon
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ color: 0x120e0b, roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.4; ground.receiveShadow = true; scene.add(ground);

  const capGeo = new RoundedBoxGeometry(0.9, 0.5, 0.9, 5, 0.14);
  const ivory = new THREE.MeshPhysicalMaterial({ color: 0xe9e0cf, roughness: 0.42, clearcoat: 0.2 });
  const carbon = new THREE.MeshPhysicalMaterial({ color: 0x24201c, roughness: 0.5, clearcoat: 0.15 });
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xc6a25e, metalness: 0.85, roughness: 0.3 });
  const keys = ['Q', 'W', 'E', 'A', 'M', 'D'];
  keys.forEach((ch, i) => {
    const x = (i % 3 - 1) * 1.05 + (i >= 3 ? 0.25 : 0), z = (Math.floor(i / 3) - 0.5) * 1.05;
    const mat = ch === 'M' ? gold : i % 2 ? carbon : ivory;
    const cap = new THREE.Mesh(capGeo, mat); cap.position.set(x, 0.25, z); cap.castShadow = cap.receiveShadow = true; scene.add(cap);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: legend(ch), transparent: true, opacity: mat === carbon ? 0 : 0.9 }));
    tag.rotation.x = -Math.PI / 2; tag.position.set(x, 0.501, z); scene.add(tag);
    if (mat === carbon) { const t2 = new THREE.Mesh(tag.geometry, new THREE.MeshBasicMaterial({ map: legend(ch), transparent: true, color: 0xe9e0cf, opacity: 0.85 })); t2.rotation.x = -Math.PI / 2; t2.position.copy(tag.position); scene.add(t2); }
  });

  const V = (a: number[]) => new THREE.Vector3(a[0], a[1], a[2]);
  const path = new THREE.CatmullRomCurve3(SHOTS.map((s) => V(s.pos)), false, 'centripetal');
  const aim = new THREE.CatmullRomCurve3(SHOTS.map((s) => V(s.target)), false, 'centripetal');
  const lens = new THREE.CatmullRomCurve3(SHOTS.map((s) => new THREE.Vector3(s.fov, 0, 0)), false, 'centripetal');
  const flow = makeFlow(SHOTS.map((s) => s.t));
  const p = spring(0.34), at = new THREE.Vector3(), tgt = new THREE.Vector3(), l = new THREE.Vector3();
  const progress = () => scroller.scrollTop / Math.max(1, scroller.scrollHeight - scroller.clientHeight);
  const place = (q: number) => {
    const u = flow(q); path.getPoint(u, at); aim.getPoint(u, tgt); lens.getPoint(u, l);
    camera.position.copy(at); camera.lookAt(tgt); camera.fov = l.x; camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  if (reduceMotion()) { place(progress()); scroller.addEventListener('scroll', () => place(progress()), { passive: true }); return; }
  p.set(progress()); place(progress());
  // Draw only while the spring is moving or the box scrolls, and only while on screen with the tab visible.
  let raf = 0, last = 0, visible = true;
  const loop = (t: number) => {
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
    place(p.step(progress(), dt));
    raf = p.moving ? requestAnimationFrame(loop) : 0; if (!raf) last = 0;
  };
  const wake = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
  scroller.addEventListener('scroll', wake, { passive: true });
  new ResizeObserver(() => place(p.step(progress(), 0))).observe(canvas);
  new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; if (!visible) { cancelAnimationFrame(raf); raf = 0; } else wake(); }).observe(canvas);
  document.addEventListener('visibilitychange', wake);
}
