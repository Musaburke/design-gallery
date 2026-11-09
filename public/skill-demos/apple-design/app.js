/* Tallbook demo motion.
   One small spring engine using Apple's two designer parameters:
   damping ratio (1 = no overshoot) and response (seconds, not a duration).
   Springs always start from their live value and keep their velocity when
   re-targeted, so every motion here can be grabbed and reversed mid-flight. */
(() => {
  'use strict';

  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = mqReduce.matches;
  mqReduce.addEventListener?.('change', (e) => { reduced = e.matches; });

  /* ---------------- Spring engine ---------------- */
  const running = new Set();
  const dirty = new Set();
  let rafId = 0;
  let lastT = 0;

  function frame(t) {
    const dt = Math.min(0.05, Math.max(0.001, (t - lastT) / 1000));
    lastT = t;
    for (const s of [...running]) s.step(dt);
    for (const fn of dirty) fn();
    dirty.clear();
    rafId = running.size ? requestAnimationFrame(frame) : 0;
  }
  function wake() {
    if (!rafId) { lastT = performance.now(); rafId = requestAnimationFrame(frame); }
  }

  class Spring {
    constructor(value, { damping = 1, response = 0.4, precision = 0.01, render } = {}) {
      this.value = value;
      this.target = value;
      this.velocity = 0;
      this.damping = damping;
      this.response = response;
      this.precision = precision;
      this.render = render;
      this.onRest = null;
    }
    to(target, opts = {}) {
      this.target = target;
      if (opts.velocity !== undefined) this.velocity = opts.velocity;
      if (opts.damping !== undefined) this.damping = opts.damping;
      if (opts.response !== undefined) this.response = opts.response;
      this.onRest = opts.onRest || null;
      if (reduced || opts.immediate) {
        this.set(target);
        const r = this.onRest; this.onRest = null; r && r();
        return this;
      }
      running.add(this);
      wake();
      return this;
    }
    /* Direct manipulation: follow the pointer 1:1, no animation. */
    set(v) {
      running.delete(this);
      this.value = v; this.target = v; this.velocity = 0;
      this.render && this.render();
    }
    /* Grab: freeze at the presentation value. */
    stop() { running.delete(this); this.onRest = null; this.velocity = 0; }
    step(dt) {
      const k = (2 * Math.PI / this.response) ** 2;      // stiffness, unit mass
      const c = 4 * Math.PI * this.damping / this.response; // damping coefficient
      const n = Math.max(1, Math.ceil(dt * 240));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        const a = -k * (this.value - this.target) - c * this.velocity;
        this.velocity += a * h;
        this.value += this.velocity * h;
      }
      if (Math.abs(this.value - this.target) < this.precision && Math.abs(this.velocity) < this.precision * 20) {
        this.value = this.target; this.velocity = 0;
        running.delete(this);
        const r = this.onRest; this.onRest = null;
        if (this.render) dirty.add(this.render);
        r && r();
        return;
      }
      if (this.render) dirty.add(this.render);
    }
  }

  /* Velocity from the last 100 ms of pointer history, not one event. */
  function tracker() {
    const h = [];
    return {
      add(x, y, t) { h.push({ x, y, t }); while (h.length > 2 && t - h[0].t > 100) h.shift(); },
      velocity() {
        if (h.length < 2) return { x: 0, y: 0 };
        const a = h[0], b = h[h.length - 1];
        const dt = (b.t - a.t) / 1000;
        if (dt <= 0 || performance.now() - b.t > 80) return { x: 0, y: 0 };
        return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
      },
      reset() { h.length = 0; },
    };
  }

  /* Apple's momentum projection (Designing Fluid Interfaces sample code). */
  const project = (v, d = 0.998) => (v / 1000) * d / (1 - d);
  /* Soft boundary: the further past, the less it follows. */
  const rubberband = (over, dim, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));

  /* ---------------- Header material on scroll ---------------- */
  const nav = document.querySelector('[data-nav]');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- Hero window arrives (critically damped) ---------------- */
  const win = document.querySelector('[data-hero-window]');
  if (win && !reduced) {
    const rise = new Spring(1, {
      precision: 0.001,
      render() {
        const p = rise.value;
        win.style.transform = `translate3d(0, ${p * 48}px, 0) scale(${1 - p * 0.03})`;
        win.style.opacity = String(Math.min(1, 1 - p * 0.9));
      },
    });
    rise.render();
    requestAnimationFrame(() => setTimeout(() => rise.to(0, { damping: 1, response: 0.7, onRest() { win.style.transform = ''; win.style.willChange = ''; } }), 120));
  }

  /* ---------------- Link popover anchored to its chip ---------------- */
  const chip = document.querySelector('[data-pop-trigger]');
  const pop = document.querySelector('[data-pop]');
  if (chip && pop) {
    // Shown by default only where it can sit beside the chip without covering the note.
    let open = window.innerWidth >= 640;
    chip.setAttribute('aria-expanded', String(open));
    pop.hidden = !open;
    const s = new Spring(open ? 1 : 0, {
      precision: 0.001,
      render() {
        const p = s.value;
        pop.style.opacity = String(Math.max(0, Math.min(1, p)));
        pop.style.transform = reduced ? '' : `scale(${0.6 + 0.4 * p})`;
        pop.hidden = p <= 0.001 && !open;
      },
    });
    const setOpen = (v) => {
      open = v;
      chip.setAttribute('aria-expanded', String(v));
      if (v) pop.hidden = false;
      s.to(v ? 1 : 0, { damping: 1, response: 0.3 });
    };
    chip.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!open); });
    document.addEventListener('click', (e) => { if (open && !pop.contains(e.target)) setOpen(false); });
    chip.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
  }

  /* ---------------- The card deck ---------------- */
  const deck = document.querySelector('[data-deck]');
  if (deck) initDeck(deck);

  function initDeck(deck) {
    const note = document.querySelector('[data-note]');
    const lines = note ? [...note.querySelectorAll('[data-src]')] : [];
    const count = document.querySelector('[data-count]');
    const flipBtn = document.querySelector('[data-flip]');
    const nextBtn = document.querySelector('[data-next]');
    const GAP = 14;

    const cards = [...deck.querySelectorAll('.card')].map((el, i) => {
      const c = { el, i, inner: el.querySelector('.card-inner'), front: el.querySelector('.card-front'), back: el.querySelector('.card-back'), throwing: 0, flipped: false };
      const render = () => draw(c);
      c.x = new Spring(0, { precision: 0.2, render });
      c.y = new Spring(0, { precision: 0.2, render });
      c.flip = new Spring(0, { precision: 0.2, render });
      c.depth = new Spring(i, { precision: 0.002, render });
      c.press = new Spring(1, { precision: 0.0005, render });
      c.enter = new Spring(1, { precision: 0.002, render });
      return c;
    });
    let order = cards.map((c) => c);
    const top = () => order[0];
    const width = () => deck.clientWidth || 320;

    function draw(c) {
      const d = c.depth.value;
      const w = width();
      const x = c.x.value;
      // Hint in the direction of travel: tilt toward where the card is going.
      const tilt = (x / w) * 9;
      const e = c.enter.value;
      const scale = (1 - d * 0.055) * c.press.value * (0.55 + 0.45 * e);
      c.el.style.transform = `translate3d(${x}px, ${c.y.value + d * GAP}px, 0) rotate(${tilt}deg) scale(${scale})`;
      c.el.style.opacity = String(Math.max(0, Math.min(1, e)) * (d > 2 ? Math.max(0, 3 - d) : 1));
      if (!reduced) c.inner.style.transform = `rotateY(${c.flip.value}deg)`;
      else c.inner.style.transform = '';
      // A thrown card that has cleared the stack tucks in behind it.
      if (c.throwing && Math.abs(x) >= w * 0.95) {
        c.throwing = 0;
        sendToBack(c);
        c.x.to(0, { damping: 1, response: 0.5 });
        c.y.to(0, { damping: 1, response: 0.5 });
      }
    }

    function syncState() {
      order.forEach((c, pos) => {
        c.el.style.zIndex = String(10 - pos);
        const isTop = pos === 0;
        c.el.classList.toggle('is-top', isTop);
        c.el.tabIndex = isTop ? 0 : -1;
        c.el.setAttribute('aria-hidden', String(!isTop));
        c.front.setAttribute('aria-hidden', String(c.flipped));
        c.back.setAttribute('aria-hidden', String(!c.flipped));
        c.el.classList.toggle('is-flipped', c.flipped);
      });
      const t = top();
      if (count) count.textContent = `${t.i + 1} / ${cards.length}`;
      lines.forEach((l) => l.classList.toggle('is-lit', Number(l.dataset.src) === t.i));
    }

    cards.forEach((c) => {
      c.el.setAttribute('role', 'button');
      c.el.setAttribute('aria-roledescription', 'card');
    });

    function flip(c, velocity) {
      c.flipped = !c.flipped;
      // Rotation spring from Apple's table: damping 0.8, response 0.4.
      c.flip.to(c.flipped ? 180 : 0, { damping: 0.8, response: 0.4, velocity });
      syncState();
    }

    function sendToBack(c) {
      const hadFocus = document.activeElement === c.el;
      order = order.filter((o) => o !== c).concat(c);
      if (c.flipped) { c.flipped = false; c.flip.to(0, { damping: 1, response: 0.4 }); }
      order.forEach((o, pos) => o.depth.to(pos, { damping: 1, response: 0.4 }));
      syncState();
      if (hadFocus) top().el.focus({ preventScroll: true });
    }

    function throwCard(c, dir, vx = 0, vy = 0) {
      c.throwing = dir;
      if (reduced) { c.throwing = 0; sendToBack(c); return; }
      // A flick carries the finger's velocity; a key press gets a gentle push.
      c.x.to(dir * width() * 1.2, { velocity: vx || dir * 1600, damping: 1, response: 0.32 });
      c.y.to(0, { velocity: vy, damping: 1, response: 0.32 });
    }

    /* Drag: 1:1 tracking, grab offset respected, velocity handed to the spring. */
    let drag = null;
    const vt = tracker();

    deck.addEventListener('pointerdown', (e) => {
      const c = top();
      if (!c.el.contains(e.target) || (e.pointerType === 'mouse' && e.button !== 0)) return;
      // Interrupt anything in flight: start from where the card is right now.
      c.x.stop(); c.y.stop();
      c.throwing = 0;
      drag = { c, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: c.x.value, oy: c.y.value, moved: false };
      vt.reset(); vt.add(e.clientX, e.clientY, performance.now());
      // Feedback on the press, not the release.
      c.press.to(0.975, { damping: 1, response: 0.18 });
    });

    deck.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 10) return; // hysteresis before committing
        drag.moved = true;
        drag.c.el.setPointerCapture(e.pointerId);
        drag.c.el.classList.add('is-dragging');
      }
      vt.add(e.clientX, e.clientY, performance.now());
      const h = drag.c.el.offsetHeight;
      drag.c.x.set(drag.ox + dx);
      drag.c.y.set(rubberband(drag.oy + dy, h)); // vertical travel resists
    });

    function release(e, cancelled) {
      if (!drag || e.pointerId !== drag.id) return;
      const { c, moved } = drag;
      drag = null;
      c.el.classList.remove('is-dragging');
      c.press.to(1, { damping: 1, response: 0.25 });
      if (!moved) {
        if (!cancelled) flip(c);
        return;
      }
      vt.add(e.clientX, e.clientY, performance.now());
      const v = cancelled ? { x: 0, y: 0 } : vt.velocity();
      const projected = c.x.value + project(v.x);
      if (!cancelled && Math.abs(projected) > width() * 0.5) {
        throwCard(c, Math.sign(projected), v.x, v.y);
      } else {
        // Came from a flick, so a touch of bounce is honest here.
        c.x.to(0, { velocity: v.x, damping: 0.8, response: 0.4 });
        c.y.to(0, { velocity: v.y, damping: 0.8, response: 0.4 });
      }
    }
    deck.addEventListener('pointerup', (e) => release(e, false));
    deck.addEventListener('pointercancel', (e) => release(e, true));
    deck.addEventListener('lostpointercapture', (e) => { if (drag && drag.moved) release(e, false); });

    deck.addEventListener('keydown', (e) => {
      const c = top();
      if (e.target !== c.el) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(c); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); throwCard(c, 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); throwCard(c, -1); }
    });
    flipBtn?.addEventListener('click', () => flip(top()));
    nextBtn?.addEventListener('click', () => throwCard(top(), 1));

    syncState();
    cards.forEach(draw);

    /* First view: cards emerge from the note they came from. */
    if (!reduced && note && 'IntersectionObserver' in window) {
      cards.forEach((c) => { c.enter.set(0); });
      lines.forEach((l) => l.classList.remove('is-lit'));
      let done = false;
      const io = new IntersectionObserver((entries) => {
        if (done || !entries.some((en) => en.isIntersecting)) return;
        done = true; io.disconnect();
        const n = note.getBoundingClientRect();
        const d = deck.getBoundingClientRect();
        const ox = (n.left + n.width / 2) - (d.left + d.width / 2);
        const oy = (n.top + n.height / 2) - (d.top + d.height / 2);
        // Back card first, so the top card lands last and on top.
        [...order].reverse().forEach((c, k) => {
          c.x.set(ox); c.y.set(oy);
          setTimeout(() => {
            lines.forEach((l) => l.classList.toggle('is-lit', Number(l.dataset.src) === c.i));
            c.x.to(0, { damping: 1, response: 0.55 });
            c.y.to(0, { damping: 1, response: 0.55 });
            c.enter.to(1, { damping: 1, response: 0.45 });
            if (k === order.length - 1) setTimeout(syncState, 500);
          }, 150 + k * 260);
        });
      }, { threshold: 0.45 });
      io.observe(deck);
    }
  }

  /* ---------------- Phone menu sheet ---------------- */
  const dialog = document.querySelector('[data-sheet]');
  const openBtn = document.querySelector('[data-menu-open]');
  if (dialog && openBtn && typeof dialog.showModal === 'function') initSheet(dialog, openBtn);

  function initSheet(dialog, openBtn) {
    const panel = dialog.querySelector('[data-sheet-panel]');
    const scrim = dialog.querySelector('[data-sheet-scrim]');
    const closeBtn = dialog.querySelector('[data-sheet-close]');
    let H = 400;
    const y = new Spring(H, {
      precision: 0.3,
      render() {
        panel.style.transform = `translate3d(0, ${y.value}px, 0)`;
        scrim.style.opacity = String(Math.max(0, Math.min(1, 1 - y.value / H)));
      },
    });

    function open() {
      if (!dialog.open) dialog.showModal();
      document.documentElement.classList.add('sheet-open');
      H = panel.offsetHeight + 16;
      if (!dialog.dataset.closing) y.set(H);
      delete dialog.dataset.closing;
      // Opened by a tap, not a flick: critically damped, no bounce.
      y.to(0, { damping: 1, response: 0.35 });
    }
    function close(velocity = 0, after) {
      dialog.dataset.closing = '1';
      y.to(H, {
        velocity, damping: 1, response: 0.3,
        onRest() {
          delete dialog.dataset.closing;
          dialog.close();
          document.documentElement.classList.remove('sheet-open');
          after ? after() : openBtn.focus({ preventScroll: true });
        },
      });
    }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', () => close());
    scrim.addEventListener('click', () => close());
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    dialog.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        close(0, () => {
          target?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
          history.replaceState(null, '', a.getAttribute('href'));
        });
      });
    });

    // Drag the sheet: 1:1 down, rubber-band up, project momentum to decide.
    let d = null;
    const vt = tracker();
    panel.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.sheet-close')) return;
      y.stop();
      d = { id: e.pointerId, sy: e.clientY, oy: y.value, moved: false };
      vt.reset(); vt.add(0, e.clientY, performance.now());
    });
    panel.addEventListener('pointermove', (e) => {
      if (!d || e.pointerId !== d.id) return;
      const dy = e.clientY - d.sy;
      if (!d.moved) {
        if (Math.abs(dy) < 10) return;
        d.moved = true;
        panel.setPointerCapture(e.pointerId);
      }
      vt.add(0, e.clientY, performance.now());
      const next = d.oy + dy;
      y.set(next < 0 ? rubberband(next, H) : next);
    });
    const end = (e) => {
      if (!d || e.pointerId !== d.id) return;
      const moved = d.moved; d = null;
      if (moved) { panel.dataset.justDragged = '1'; setTimeout(() => { delete panel.dataset.justDragged; }, 0); }
      if (!moved) { if (y.value !== 0) y.to(0, { damping: 1, response: 0.35 }); return; }
      vt.add(0, e.clientY, performance.now());
      const v = vt.velocity().y;
      const landing = y.value + project(v);
      if (landing > H * 0.5) close(Math.max(0, v));
      else y.to(0, { velocity: v, damping: 0.8, response: 0.3 }); // drawer value from Apple's table
    };
    panel.addEventListener('pointerup', end);
    panel.addEventListener('pointercancel', end);
    // Swallow the click that ends a drag so links don't fire.
    panel.addEventListener('click', (e) => { if (panel.dataset.justDragged) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
})();
