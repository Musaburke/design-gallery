// Tallbook demo. No libraries. Every animation is a CSS transition we toggle,
// so rapid clicks retarget instead of restarting.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Header hairline once scrolled ---------- */
  const header = document.querySelector('[data-header]');
  const onScroll = () => header.toggleAttribute('data-scrolled', window.scrollY > 4);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu (origin-aware popover) ---------- */
  const trigger = document.querySelector('[data-menu-trigger]');
  const panel = document.querySelector('[data-menu-panel]');
  panel.hidden = false; // CSS owns visibility from here so it can transition
  const setMenu = (open, { focus = false } = {}) => {
    panel.toggleAttribute('data-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    if (open && focus) panel.querySelector('a')?.focus();
    if (!open && focus) trigger.focus();
  };
  trigger.addEventListener('click', (e) => {
    const open = !panel.hasAttribute('data-open');
    // Keyboard opens focus the first item; pointer opens don't steal focus.
    setMenu(open, { focus: open && e.detail === 0 });
  });
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('pointerdown', (e) => {
    if (panel.hasAttribute('data-open') && !e.target.closest('.menu')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.hasAttribute('data-open')) setMenu(false, { focus: true });
  });

  /* ---------- Hero deck: stacked revision cards ---------- */
  const deck = document.querySelector('[data-deck]');
  const cards = [...deck.querySelectorAll('[data-card]')];
  const order = cards.slice();
  const count = deck.querySelector('[data-count]');
  const revealBtn = deck.querySelector('[data-reveal]');
  const nextBtn = deck.querySelector('[data-next]');
  let shown = 0;
  const exitTimers = new Map();

  const layout = () => {
    order.forEach((card, i) => {
      if (exitTimers.has(card)) return; // still leaving; its timer will place it
      card.dataset.pos = String(Math.min(i, 3));
      const front = i === 0;
      card.inert = !front;
      card.setAttribute('aria-hidden', String(!front));
    });
    const front = order[0];
    const revealed = front.hasAttribute('data-revealed');
    revealBtn.textContent = revealed ? 'Hide answer' : 'Show answer';
    revealBtn.setAttribute('aria-expanded', String(revealed));
    count.textContent = `${(shown % cards.length) + 1} / ${cards.length}`;
  };

  revealBtn.addEventListener('click', () => {
    order[0].toggleAttribute('data-revealed');
    layout();
  });

  nextBtn.addEventListener('click', () => {
    const leaving = order.shift();
    order.push(leaving);
    shown++;
    clearTimeout(exitTimers.get(leaving));
    leaving.dataset.pos = 'out';
    leaving.inert = true;
    leaving.setAttribute('aria-hidden', 'true');
    // After the quick exit, snap it to the back of the stack with no travel.
    exitTimers.set(leaving, setTimeout(() => {
      exitTimers.delete(leaving);
      leaving.removeAttribute('data-revealed');
      leaving.setAttribute('data-snap', '');
      leaving.dataset.pos = String(Math.min(order.indexOf(leaving), 3));
      void leaving.offsetHeight;
      leaving.removeAttribute('data-snap');
      layout();
    }, 200));
    layout();
  });
  layout();

  /* ---------- Toast for actions this made-up product can't take ---------- */
  const toaster = document.querySelector('[data-toaster]');
  const MESSAGE = 'Tallbook is a made-up product, built to compare design approaches.';
  const DURATION = 4000;
  let toast = null, remaining = DURATION, startedAt = 0, timer = 0, paused = false;

  const dismiss = () => {
    if (!toast) return;
    const el = toast;
    toast = null;
    clearTimeout(timer);
    el.setAttribute('data-leaving', '');
    setTimeout(() => el.remove(), 220);
  };
  const run = () => { startedAt = Date.now(); clearTimeout(timer); timer = setTimeout(dismiss, remaining); };
  const pause = () => { if (!toast || paused) return; paused = true; clearTimeout(timer); remaining -= Date.now() - startedAt; };
  const resume = () => { if (!toast || !paused) return; paused = false; run(); };

  const showToast = () => {
    remaining = DURATION;
    if (toast) {
      // Already up: restart the clock and give a small nudge so the click still registers.
      toast.removeAttribute('data-bump');
      void toast.offsetWidth;
      toast.setAttribute('data-bump', '');
      if (!paused) run();
      return;
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<p></p><button class="icon-btn" type="button" aria-label="Dismiss"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>`;
    el.querySelector('p').textContent = MESSAGE;
    el.querySelector('button').addEventListener('click', dismiss);
    el.addEventListener('pointerenter', pause);
    el.addEventListener('pointerleave', resume);
    el.addEventListener('focusin', pause);
    el.addEventListener('focusout', resume);
    swipeToDismiss(el);
    toaster.append(el);
    toast = el;
    paused = false;
    run();
  };

  // Invisible edge case: a hidden tab shouldn't eat the toast's time.
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));

  // Flick down to dismiss: velocity counts, not just distance.
  function swipeToDismiss(el) {
    let startY = 0, startT = 0, dy = 0, id = null;
    el.addEventListener('pointerdown', (e) => {
      if (id !== null || e.target.closest('button')) return; // ignore extra fingers
      id = e.pointerId; startY = e.clientY; startT = Date.now(); dy = 0;
      el.setPointerCapture(id);
      el.style.transition = 'none';
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const raw = e.clientY - startY;
      // Upward drag gets friction instead of a hard stop.
      dy = raw < 0 ? -Math.sqrt(-raw) * 2 : raw;
      el.style.transform = `translateY(${dy}px)`;
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      el.style.transition = '';
      const velocity = Math.abs(dy) / Math.max(1, Date.now() - startT);
      if (dy > 40 || (dy > 0 && velocity > 0.11)) { el.style.transform = ''; dismiss(); }
      else el.style.transform = '';
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  document.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', showToast));

  /* ---------- Scroll reveals (once) ---------- */
  const revealEls = document.querySelectorAll('[data-inview], [data-inview-group]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -80px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Demo: a note becoming cards ---------- */
  const demo = document.querySelector('[data-demo]');
  const slots = [...demo.querySelectorAll('[data-card-for]')];
  const lines = [...demo.querySelectorAll('[data-src]')];
  const light = (key) => lines.forEach((l) => l.classList.toggle('is-lit', l.dataset.src === key));

  // Pointing at a card lights the lines it came from.
  slots.forEach((slot) => {
    const key = slot.dataset.cardFor;
    const btn = slot.querySelector('[data-flip]');
    slot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') light(key); });
    slot.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') light(null); });
    btn.addEventListener('focus', () => light(key));
    btn.addEventListener('blur', () => light(null));
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      btn.querySelector('.face-front').setAttribute('aria-hidden', String(on));
      btn.querySelector('.face-back').setAttribute('aria-hidden', String(!on));
      light(key);
    });
  });

  // One-time explanation when the demo scrolls into view:
  // light the source lines, then the card arrives. Skipped for reduced motion.
  if (!reduce.matches && 'IntersectionObserver' in window) {
    slots.forEach((s) => s.classList.add('is-waiting'));
    const play = () => {
      const STEP = 520;
      slots.forEach((slot, i) => {
        setTimeout(() => light(slot.dataset.cardFor), i * STEP);
        setTimeout(() => slot.classList.remove('is-waiting'), i * STEP + 220);
      });
      setTimeout(() => light(null), slots.length * STEP + 200);
    };
    const io2 = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io2.disconnect(); play(); }
    }, { threshold: 0.4 });
    io2.observe(demo);
  }
})();
