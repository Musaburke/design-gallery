// A liquid glass lens drawn on the GPU with one fragment shader. The picture refracts through a
// wobbling edge, with a colour split at the rim, a glossy fresnel edge, moving highlights and a
// soft glow. It leans towards the cursor, dents where you hover and ripples like jelly when
// tapped. show(i) cross-fades to another picture.
// Pass any images or canvases as `pictures`. Pauses off screen and when the tab is hidden.
// Reduced motion: still glass, no wobble, lean or ripple. No WebGL: a flat round lens in 2D.

type Picture = HTMLImageElement | HTMLCanvasElement;
export type Lens = { show: (i: number) => void; setGlow: (g: number) => void };

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uMotion;
uniform sampler2D uT0; uniform sampler2D uT1; uniform float uMix;
uniform vec4 uF0; uniform vec4 uF1;
uniform vec2 uPtr; uniform float uHover; uniform vec3 uRip; uniform float uGlow;
uniform vec2 uPx0; uniform vec2 uPx1; // one texel of each picture, for sharpening

// The picture with a light unsharp mask, so detail survives being scaled down into the lens.
vec3 sharp(sampler2D t, vec4 f, vec2 q, vec2 px) {
  vec2 uv = f.xy + q * f.zw;
  vec3 c = texture2D(t, uv).rgb;
  vec3 blur = (texture2D(t, uv + vec2(px.x, 0.0)).rgb + texture2D(t, uv - vec2(px.x, 0.0)).rgb +
               texture2D(t, uv + vec2(0.0, px.y)).rgb + texture2D(t, uv - vec2(0.0, px.y)).rgb) * 0.25;
  return clamp(c + (c - blur) * 0.7, 0.0, 1.0);
}
vec3 split(sampler2D t, vec4 f, vec2 q, float ca, vec2 px) {
  vec3 c = sharp(t, f, q, px);
  if (ca < 0.002) return c;                                     // colour split only at the rim
  return vec3(texture2D(t, f.xy + q * (1.0 + ca) * f.zw).r, c.g, texture2D(t, f.xy + q * (1.0 - ca) * f.zw).b);
}
void main() {
  vec2 p = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  float r = length(p), a = atan(p.y, p.x + 1e-6), t = uTime;
  float R = 0.8 * (1.0 + uMotion * (0.026 * sin(3.0 * a + t * 0.7) + 0.017 * sin(5.0 * a - t * 1.1) + 0.009 * sin(7.0 * a + t * 1.7)));
  float pa = atan(uPtr.y, uPtr.x + 1e-4); // atan(0, 0) is undefined on some GPUs
  float d = abs(atan(sin(a - pa), cos(a - pa)));
  R -= uHover * 0.065 * exp(-d * d * 3.5);                       // dent where the pointer presses
  R += uHover * 0.02 * exp(-(3.14159 - d) * (3.14159 - d) * 3.0); // and bulge on the far side
  if (uRip.z >= 0.0) {
    float dist = length(p - uRip.xy);
    R += 0.05 * sin(dist * 13.0 - uRip.z * 16.0) * exp(-uRip.z * 2.2) * exp(-dist * 1.2);
  }
  float aa = 3.0 / uRes.x;
  float inside = 1.0 - smoothstep(R - aa, R + aa, r);
  float q = clamp(r / R, 0.0, 1.0);
  float z = sqrt(max(1.0 - q * q, 0.0));
  vec3 n = normalize(vec3(p / R, z + 1e-4));
  vec2 base = p / R;
  vec2 qr = base * (0.8 + 0.17 * z) - uPtr * uHover * 0.03;      // ball-lens refraction, gentle so the picture stays sharp
  float ca = pow(1.0 - z, 3.0) * 0.014;                          // colour split only at the very edge
  vec3 col = split(uT1, uF1, qr, ca, uPx1);
  if (uMix < 0.999) col = mix(split(uT0, uF0, qr, ca, uPx0), col, uMix);
  col *= mix(0.62, 1.0, smoothstep(0.0, 0.5, z));               // thick glass darkens towards the rim
  float fr = pow(1.0 - z, 3.0);
  col += vec3(0.7, 0.95, 1.0) * fr * 0.32;                        // fresnel gloss
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L1 = normalize(vec3(-0.5 + 0.07 * sin(t * 0.4) + uPtr.x * 0.2, 0.55 + uPtr.y * 0.2, 0.75));
  float s1 = pow(max(dot(n, normalize(L1 + V)), 0.0), 260.0);
  float s1b = pow(max(dot(n, normalize(L1 + V)), 0.0), 24.0) * 0.07;
  float s2 = pow(max(dot(n, normalize(normalize(vec3(0.55, -0.5, 0.6)) + V)), 0.0), 40.0) * 0.22;
  col += vec3(1.0) * (s1 * 0.7 + s1b + s2 * 0.7);
  vec3 accent = vec3(0.81, 0.97, 0.62);
  float rim = smoothstep(aa * 2.5, 0.0, abs(r - R));
  col = mix(col, accent + 0.15, rim * (0.35 + 0.4 * uGlow));
  float og = exp(-max(r - R, 0.0) * 24.0) * (1.0 - inside) * (0.12 + 0.55 * uGlow);
  gl_FragColor = vec4(col * inside + accent * og, inside + og);
}`;

export function mountGlass(canvas: HTMLCanvasElement, pictures: Picture[], reduced: () => boolean): Lens {
  const ctx = (canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false }) ??
    canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false })) as WebGLRenderingContext | null;
  if (!ctx) return mountFlat(canvas, pictures);
  const gl: WebGLRenderingContext = ctx;
  const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    // A canvas that already has a WebGL context cannot give a 2D one, so swap in a fresh canvas.
    const fresh = canvas.cloneNode() as HTMLCanvasElement;
    canvas.replaceWith(fresh);
    return mountFlat(fresh, pictures);
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const u = {
    res: U('uRes'), time: U('uTime'), motion: U('uMotion'), t0: U('uT0'), t1: U('uT1'), mix: U('uMix'),
    f0: U('uF0'), f1: U('uF1'), ptr: U('uPtr'), hover: U('uHover'), rip: U('uRip'), glow: U('uGlow'),
    px0: U('uPx0'), px1: U('uPx1'),
  };
  gl.uniform1i(u.t0, 0);
  gl.uniform1i(u.t1, 1);
  gl.clearColor(0, 0, 0, 0);

  const isPow2 = (n: number) => (n & (n - 1)) === 0;
  const texs = pictures.map((pic) => {
    const w = (pic as HTMLImageElement).naturalWidth || pic.width, h = (pic as HTMLImageElement).naturalHeight || pic.height;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pic);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (isGL2 || (isPow2(w) && isPow2(h))) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return { tex, w, h };
  });

  // Where the picture sits behind the lens: centre and half-size in texture space, filling the lens.
  const frameVec = (i: number): [number, number, number, number] => {
    const A = texs[i].w / texs[i].h;
    return [0.5, 0.5, A >= 1 ? 0.5 / A : 0.5, A >= 1 ? 0.5 : 0.5 * A];
  };

  let cur = 0, prev = 0, fadeStart = -1, glow = 0.35;
  let hover = 0, hoverTarget = 0, ptr = [0, 0], ptrTarget = [0, 0];
  let lean = [0, 0], leanV = [0, 0], ripStart = -1, ripAt = [0, 0];
  let raf = 0, running = false, visible = false, dpr = 1, last = performance.now();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const s = Math.max(1, Math.round(canvas.clientWidth * dpr));
    if (canvas.width !== s) { canvas.width = s; canvas.height = s; }
    gl.viewport(0, 0, s, s);
    draw(performance.now());
  }

  function bind(unit: number, i: number) {
    gl.activeTexture(unit === 0 ? gl.TEXTURE0 : gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texs[i].tex);
  }

  function draw(now: number) {
    const mo = reduced();
    let mix = 1; // 1 shows the current picture alone, so the shader samples one texture
    if (fadeStart >= 0) {
      const f = Math.min(1, (now - fadeStart) / 900);
      mix = f * f * (3 - 2 * f);
      if (f >= 1) { fadeStart = -1; prev = cur; mix = 1; }
    }
    const a = fadeStart >= 0 ? prev : cur, b = cur;
    gl.clear(gl.COLOR_BUFFER_BIT);
    bind(0, a); bind(1, b);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, mo ? 0 : now / 1000);
    gl.uniform1f(u.motion, mo ? 0 : 1);
    gl.uniform1f(u.mix, mix);
    gl.uniform4fv(u.f0, frameVec(a)); gl.uniform4fv(u.f1, frameVec(b));
    gl.uniform2f(u.ptr, ptr[0], ptr[1]);
    gl.uniform1f(u.hover, hover);
    gl.uniform3f(u.rip, ripAt[0], ripAt[1], ripStart < 0 ? -1 : (now - ripStart) / 1000);
    gl.uniform1f(u.glow, glow);
    gl.uniform2f(u.px0, 1 / texs[a].w, 1 / texs[a].h); gl.uniform2f(u.px1, 1 / texs[b].w, 1 / texs[b].h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function step(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // Springs: hover strength, pointer direction and the lean towards the cursor.
    hover += (hoverTarget - hover) * Math.min(1, dt * 8);
    ptr[0] += (ptrTarget[0] - ptr[0]) * Math.min(1, dt * 10);
    ptr[1] += (ptrTarget[1] - ptr[1]) * Math.min(1, dt * 10);
    for (let k = 0; k < 2; k++) {
      const target = ptrTarget[k] * hoverTarget * 14 * (k ? -1 : 1);
      leanV[k] += ((target - lean[k]) * 90 - leanV[k] * 11) * dt; // a jelly-like spring
      lean[k] += leanV[k] * dt;
    }
    canvas.style.setProperty('--lx', `${lean[0].toFixed(2)}px`);
    canvas.style.setProperty('--ly', `${lean[1].toFixed(2)}px`);
    if (ripStart >= 0 && now - ripStart > 2500) ripStart = -1;
    draw(now);
    raf = requestAnimationFrame(step);
  }
  function sync() {
    const want = visible && !document.hidden && !reduced();
    if (want && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(step); }
    else if (!want) { running = false; cancelAnimationFrame(raf); draw(performance.now()); }
  }

  // Pointer: listens on the window, so text above the lens never blocks it.
  function local(e: PointerEvent): [number, number, number] {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    return [x, y, Math.hypot(x, y)];
  }
  window.addEventListener('pointermove', (e) => {
    if (!visible || reduced()) return;
    const [x, y, d] = local(e);
    if (d < 1.1) { const l = Math.max(d, 0.001); ptrTarget = [x / l, y / l].map((v) => v * Math.min(1, d)); hoverTarget = 1 - Math.max(0, d - 0.55) / 0.55; }
    else hoverTarget = 0;
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (!visible || reduced()) return;
    const [x, y, d] = local(e);
    if (d < 0.85) { ripAt = [x, y]; ripStart = performance.now(); leanV[0] -= x * 260; leanV[1] += y * 260; }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { hoverTarget = 0; });

  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; sync(); }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  resize();

  return {
    show(i: number) {
      if (i === cur || !texs[i]) return;
      prev = cur;
      cur = i;
      fadeStart = reduced() ? -1 : performance.now();
      if (reduced()) prev = cur;
      draw(performance.now());
    },
    setGlow(g: number) { glow = g; draw(performance.now()); },
  };
}

// No WebGL: the picture inside a round, softly lit lens, drawn in 2D.
function mountFlat(canvas: HTMLCanvasElement, pictures: Picture[]): Lens {
  const c = canvas.getContext('2d')!;
  let cur = 0, glow = 0.35;
  function draw() {
    const s = Math.max(1, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2)));
    canvas.width = canvas.height = s;
    const R = s * 0.46;
    c.clearRect(0, 0, s, s);
    c.save();
    c.beginPath();
    c.arc(s / 2, s / 2, R, 0, Math.PI * 2);
    c.clip();
    c.drawImage(pictures[cur], 0, 0, s, s);
    c.restore();
    c.lineWidth = Math.max(1.5, s * 0.004);
    c.strokeStyle = `rgba(206, 247, 158, ${0.35 + 0.45 * glow})`;
    c.beginPath();
    c.arc(s / 2, s / 2, R, 0, Math.PI * 2);
    c.stroke();
  }
  new ResizeObserver(draw).observe(canvas);
  draw();
  return { show(i: number) { if (pictures[i]) { cur = i; draw(); } }, setGlow(g: number) { glow = g; draw(); } };
}
