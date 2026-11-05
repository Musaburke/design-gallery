// Shared Three.js plumbing: renderer on a given canvas, sizing, and a loop that
// only runs while the canvas is on screen and the tab is visible.
import * as THREE from 'three';

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Heartbeat level published by Starfield.astro (0 at rest, ~1 at the peak).
export const heartbeat = () => (window as unknown as { __beat?: number }).__beat ?? 0;

export function createStage(canvas: HTMLCanvasElement, fov = 40) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    canvas.remove();
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const run = (frame: (t: number) => void) => {
    if (reduceMotion()) { frame(0); renderer.render(scene, camera); return; }
    let raf = 0, visible = true;
    const loop = (t: number) => { frame(t); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    const sync = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(canvas);
    document.addEventListener('visibilitychange', sync);
    sync();
  };

  return { renderer, scene, camera, run };
}

// Pointer position in -1..1, smoothed by the caller.
export function trackPointer() {
  const p = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    p.x = (e.clientX / innerWidth) * 2 - 1;
    p.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  return p;
}
