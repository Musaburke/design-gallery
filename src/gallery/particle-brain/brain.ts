// The brain: a dense particle sphere with a network of lines through it. It morphs
// to a galaxy, reacts to activity, and parts around the cursor.
// Fills its canvas, listens to the pointer over its own frame only, and runs only while
// the canvas is on screen and the tab is visible, so several can share a page.
import * as THREE from 'three';

export type OrbState = 'idle' | 'listening' | 'working' | 'speaking' | 'error';
export type OrbShape = 'sphere' | 'galaxy';

const COUNT = 9000;
const LINE_NODES = 1000;
const RADIUS = 2;

const BEHAVIOUR: Record<OrbState, { spin: number; energy: number; pulse: number }> = {
  idle: { spin: 0.05, energy: 0.12, pulse: 0.012 },
  listening: { spin: 0.05, energy: 0.3, pulse: 0.05 },
  working: { spin: 0.28, energy: 0.9, pulse: 0.02 },
  speaking: { spin: 0.08, energy: 0.45, pulse: 0.07 },
  error: { spin: 0.02, energy: 1.3, pulse: 0.01 },
};

const vertex = /* glsl */ `
  attribute vec3 aGalaxy; attribute float aSize; attribute float aSeed;
  uniform float uTime, uMorph, uEnergy, uPulse, uPixel;
  uniform vec2 uMouse; uniform float uAspect;
  varying float vCore; varying float vSeed; varying float vNear;
  void main() {
    vec3 p = mix(position, aGalaxy, uMorph);
    float breath = 1.0 + uPulse * sin(uTime * 2.4 + length(p) * 2.0);
    p *= breath;
    p += 0.035 * (1.0 + uEnergy * 2.5) * sin(uTime * 0.9 + aSeed * 40.0 + p.yzx * 2.4);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;
    vec2 away = (ndc - uMouse) * vec2(uAspect, 1.0);
    float near = exp(-dot(away, away) * 26.0);
    clip.xy += normalize(away + 0.0001) * near * 0.05 * clip.w;
    vNear = near;
    gl_Position = clip;
    gl_PointSize = aSize * uPixel * (1.0 + near * 0.7) * (6.5 / -mv.z);
    vCore = 1.0 - smoothstep(0.0, RADIUS_VALUE, length(position));
    vSeed = aSeed;
  }`.replace('RADIUS_VALUE', RADIUS.toFixed(1));

const fragment = /* glsl */ `
  uniform vec3 uColor; uniform float uTime;
  varying float vCore; varying float vSeed; varying float vNear;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float glow = pow(max(0.0, 1.0 - d), 2.2);
    float twinkle = 0.72 + 0.28 * sin(uTime * 1.7 + vSeed * 90.0);
    float whiteness = smoothstep(0.55, 1.0, vCore) * 0.55 + step(0.96, vSeed) * 0.55 + vNear * 0.4;
    vec3 colour = mix(uColor, vec3(1.0, 0.96, 0.95), clamp(whiteness, 0.0, 0.95));
    gl_FragColor = vec4(colour, glow * twinkle * (0.85 + vCore * 0.15));
  }`;

const lineVertex = /* glsl */ `
  attribute vec3 aGalaxy; uniform float uMorph;
  void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(position, aGalaxy, uMorph), 1.0); }`;
const lineFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity;
  void main() { gl_FragColor = vec4(uColor, uOpacity); }`;

function spherePoint(): THREE.Vector3 {
  // Denser toward the middle, with an even outer shell for the network look.
  const r = RADIUS * Math.pow(Math.random(), 0.5);
  const u = Math.random() * 2 - 1;
  const a = Math.random() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return new THREE.Vector3(r * s * Math.cos(a), r * u, r * s * Math.sin(a));
}

function galaxyPoint(): THREE.Vector3 {
  const arm = Math.floor(Math.random() * 4);
  const t = Math.pow(Math.random(), 0.7);
  const angle = (arm / 4) * Math.PI * 2 + t * 7.5 + (Math.random() - 0.5) * 0.5;
  const r = t * RADIUS * 1.25 + 0.03;
  const scatter = 0.1 + (1 - t) * 0.1;
  return new THREE.Vector3(
    Math.cos(angle) * r + (Math.random() - 0.5) * scatter,
    Math.sin(angle) * r + (Math.random() - 0.5) * scatter,
    (Math.random() - 0.5) * 0.14,
  );
}

export function mountBrain(canvas: HTMLCanvasElement, area: HTMLElement = canvas) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.z = 7.4;

  const sphere: THREE.Vector3[] = [];
  const galaxy: THREE.Vector3[] = [];
  const positions = new Float32Array(COUNT * 3);
  const galaxies = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const a = spherePoint();
    const b = galaxyPoint();
    sphere.push(a);
    galaxy.push(b);
    a.toArray(positions, i * 3);
    b.toArray(galaxies, i * 3);
    seeds[i] = Math.random();
    sizes[i] = seeds[i] > 0.97 ? 8 + Math.random() * 6 : 3.2 + Math.random() * 3.6;
  }

  const uniforms = {
    uTime: { value: 0 }, uMorph: { value: 0 }, uEnergy: { value: 0.1 }, uPulse: { value: 0.01 }, uPixel: { value: 1 },
    uMouse: { value: new THREE.Vector2(9, 9) }, uAspect: { value: 1 }, uColor: { value: new THREE.Color('#e0529c') },
  };
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aGalaxy', new THREE.BufferAttribute(galaxies, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending });
  const group = new THREE.Group();
  group.add(new THREE.Points(geometry, material));

  // Join outer nodes to their nearest neighbours for the network lines.
  const nodes: number[] = [];
  for (let i = 0; i < COUNT && nodes.length < LINE_NODES; i++) if (sphere[i].length() > RADIUS * 0.45) nodes.push(i);
  const linePositions: number[] = [];
  const lineGalaxy: number[] = [];
  for (const i of nodes) {
    const nearest = nodes.filter((k) => k !== i)
      .map((k) => ({ k, d: sphere[k].distanceToSquared(sphere[i]) }))
      .sort((x, y) => x.d - y.d).slice(0, 2);
    for (const { k } of nearest) {
      linePositions.push(...sphere[i].toArray(), ...sphere[k].toArray());
      lineGalaxy.push(...galaxy[i].toArray(), ...galaxy[k].toArray());
    }
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('aGalaxy', new THREE.Float32BufferAttribute(lineGalaxy, 3));
  const lineUniforms = { uColor: uniforms.uColor, uMorph: uniforms.uMorph, uOpacity: { value: 0.13 } };
  group.add(new THREE.LineSegments(lineGeometry, new THREE.ShaderMaterial({ vertexShader: lineVertex, fragmentShader: lineFragment,
    uniforms: lineUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  scene.add(group);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = w / h;
    uniforms.uPixel.value = renderer.getPixelRatio() * Math.min(h / 900, 1.4);
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  const pointer = { x: 0, y: 0, active: false };
  const onMove = (e: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - box.left) / box.width) * 2 - 1;
    pointer.y = -(((e.clientY - box.top) / box.height) * 2 - 1);
    pointer.active = true;
  };
  const onLeave = () => { pointer.active = false; uniforms.uMouse.value.set(9, 9); pointer.x = 0; pointer.y = 0; };
  area.addEventListener('pointermove', onMove, { passive: true });
  area.addEventListener('pointerleave', onLeave);

  let state: OrbState = 'idle';
  let shape: OrbShape = 'sphere';
  let paused = false;
  let spin = BEHAVIOUR.idle.spin;
  let angle = 0;
  let tiltX = 0, tiltY = 0;
  const target = new THREE.Color('#e0529c');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const advance = (dt: number, time: number) => {
    const b = BEHAVIOUR[state];
    uniforms.uTime.value = time;
    uniforms.uEnergy.value += (b.energy - uniforms.uEnergy.value) * 0.03;
    uniforms.uPulse.value += (b.pulse - uniforms.uPulse.value) * 0.03;
    uniforms.uMorph.value += ((shape === 'galaxy' ? 1 : 0) - uniforms.uMorph.value) * (1 - Math.exp(-dt * 1.2));
    // The network belongs to the sphere, so its lines fade out as the galaxy forms.
    lineUniforms.uOpacity.value = 0.13 * Math.max(0, 1 - uniforms.uMorph.value * 2.5);
    uniforms.uColor.value.lerp(target, 1 - Math.exp(-dt * 0.9));
    if (pointer.active) uniforms.uMouse.value.set(pointer.x, pointer.y);
    spin += (b.spin - spin) * 0.03;
    angle += spin * dt;
    tiltX += (-pointer.y * 0.22 - tiltX) * 0.04;
    tiltY += (pointer.x * 0.32 - tiltY) * 0.04;
    // A galaxy faces the camera and turns in its own plane, a sphere turns on its axis.
    const morph = uniforms.uMorph.value;
    group.rotation.set(tiltX, angle * (1 - morph) + tiltY, angle * morph);
  };

  let raf = 0, last = 0;
  const loop = (t: number) => {
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    advance(dt, t / 1000);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  const still = () => {
    uniforms.uColor.value.copy(target);
    uniforms.uMorph.value = shape === 'galaxy' ? 1 : 0;
    lineUniforms.uOpacity.value = shape === 'galaxy' ? 0 : 0.13;
    renderer.render(scene, camera);
  };
  let visible = false;
  const sync = () => {
    cancelAnimationFrame(raf);
    if (reduced() || paused) return still();
    if (visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); }
  };
  const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; sync(); });
  io.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  sync();

  return {
    setColor(colour: string) { target.set(colour); if (reduced() || paused) still(); },
    setState(next: OrbState) { state = next; },
    setShape(next: OrbShape) { shape = next; if (reduced() || paused) still(); },
    setPaused(next: boolean) { paused = next; sync(); },
    dispose() {
      cancelAnimationFrame(raf);
      observer.disconnect();
      io.disconnect();
      area.removeEventListener('pointermove', onMove);
      area.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', sync);
      renderer.dispose();
    },
  };
}
