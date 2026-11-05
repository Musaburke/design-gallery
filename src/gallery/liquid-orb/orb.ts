// A liquid-morph orb. An icosahedron whose vertices ripple with layered
// sine noise, shaded like iridescent glass (clearcoat + iridescence lit by a room
// environment), with a wireframe twin that fades in while the cursor is over it.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createStage, heartbeat, trackPointer } from '../../lib/stage';

export function mountOrb(canvas: HTMLCanvasElement) {
  const stage = createStage(canvas, 35);
  if (!stage) return;
  const { renderer, scene, camera, run } = stage;
  camera.position.set(0, 0, 5.4);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Icosahedron vertices are unshared; merging them gives smooth normals instead of facets.
  const geo = mergeVertices(new THREE.IcosahedronGeometry(1.45, 40));
  const base = Float32Array.from(geo.attributes.position.array as Float32Array);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x3d5a47,
    metalness: 0.35,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 1,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [120, 820],
    envMapIntensity: 1.2,
  });
  const orb = new THREE.Mesh(geo, mat);
  scene.add(orb);

  const wireMat = new THREE.MeshBasicMaterial({ color: 0xd9e4d8, wireframe: true, transparent: true, opacity: 0 });
  const wire = new THREE.Mesh(geo, wireMat);
  wire.scale.setScalar(1.012);
  scene.add(wire);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fd09c, 2.2);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  let hover = 0, hoverTarget = 0;
  canvas.addEventListener('pointerenter', () => (hoverTarget = 1));
  canvas.addEventListener('pointerleave', () => (hoverTarget = 0));
  const pointer = trackPointer();
  let rx = 0, ry = 0;

  const v = new THREE.Vector3();
  const displace = (t: number) => {
    const time = t * 0.00045;
    const b = heartbeat();
    for (let i = 0; i < pos.count; i++) {
      v.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
      const n = v.clone().normalize();
      const wave =
        Math.sin(n.x * 2.6 + time * 1.7) * 0.5 +
        Math.sin(n.y * 3.1 - time * 1.3) * 0.35 +
        Math.sin(n.z * 3.7 + time * 2.1 + n.x * 1.5) * 0.25;
      const amp = 0.09 + b * 0.04 + hover * 0.05;
      v.addScaledVector(n, wave * amp);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };

  run((t) => {
    hover += (hoverTarget - hover) * 0.06;
    rx += (pointer.y * 0.4 - rx) * 0.05;
    ry += (pointer.x * 0.6 - ry) * 0.05;
    displace(t);
    orb.rotation.set(rx + t * 0.00006, ry + t * 0.00011, 0);
    wire.rotation.copy(orb.rotation);
    wireMat.opacity = hover * 0.22;
  });
}
