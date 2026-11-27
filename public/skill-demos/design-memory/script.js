// Tallbook hero: each idea in the note lights up, then lifts out of its line and becomes a revision card.
// No JS: the cards sit finished beside the note. Reduced motion: the finished state, no travel.
(() => {
  const root = document.documentElement;
  const stage = document.querySelector('.stage');
  const cards = [...document.querySelectorAll('.card')];
  const replay = document.getElementById('replay');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  let running = false;

  const lines = (i) => [...document.querySelectorAll(`.note [data-src="${i}"]`)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function play() {
    if (running) return;
    running = true;
    replay.classList.remove('show');
    root.style.setProperty('--idle', 'paused');
    document.querySelectorAll('.note .lit').forEach((l) => l.classList.remove('lit'));
    cards.forEach((c) => { c.style.opacity = '0'; });
    await wait(500);

    for (const [i, card] of cards.entries()) {
      const src = lines(i);
      src.forEach((l) => l.classList.add('lit'));
      await wait(420);
      // Start the card on top of its source line, then let it travel to its place in the stack.
      const from = src[0].getBoundingClientRect();
      card.style.opacity = '';
      const to = card.getBoundingClientRect();
      const dx = from.left - to.left, dy = from.top - to.top;
      const sx = Math.min(1, from.width / to.width);
      const rest = getComputedStyle(card).transform;
      card.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, 0.35)`, opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: rest, opacity: 1 },
      ], { duration: 950, easing: ease });
      await wait(520);
    }
    await wait(600);
    replay.classList.add('show');
    root.style.setProperty('--idle', 'running');
    running = false;
  }

  function finished() {
    cards.forEach((c) => { c.style.opacity = ''; });
    document.querySelectorAll('.note [data-src]').forEach((l) => l.classList.add('lit'));
  }

  replay.addEventListener('click', play);

  // Play once when the stage is on screen; hold the idle breathing while offscreen or the tab is hidden.
  let played = false;
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !played) { played = true; still.matches ? finished() : play(); }
    if (!running) root.style.setProperty('--idle', e.isIntersecting && !document.hidden ? 'running' : 'paused');
  }, { threshold: 0.35 });
  io.observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (!running) root.style.setProperty('--idle', document.hidden ? 'paused' : 'running');
  });

  // Flip cards.
  document.querySelectorAll('.flip').forEach((b) => b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))));

  // Feature tabs, with arrow-key movement.
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (t) => tabs.forEach((x) => {
    const on = x === t;
    x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
    document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus(); }
    });
  });

  // Questions open and close with a short height animation. Without JS or with reduced motion they snap.
  document.querySelectorAll('.faq details').forEach((d) => {
    const ans = d.querySelector('.ans');
    d.querySelector('summary').addEventListener('click', (e) => {
      if (still.matches) return;
      e.preventDefault();
      ans.getAnimations().forEach((a) => a.cancel());
      if (d.open) {
        const a = ans.animate([{ height: ans.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 200, easing: ease });
        a.onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        ans.animate([{ height: '0px', opacity: 0 }, { height: ans.offsetHeight + 'px', opacity: 1 }], { duration: 280, easing: ease });
      }
    });
  });

  // Sections rise in once as they arrive.
  root.classList.add('js');
  const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: 0.15 });
  document.querySelectorAll('[data-reveal]').forEach((el) => rio.observe(el));
})();
