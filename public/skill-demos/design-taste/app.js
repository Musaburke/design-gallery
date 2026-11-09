// Tallbook demo page. Everything here is an enhancement: without it, the page shows the note,
// the three cards (front and back), the first app state and the new-notebook dialog.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- section entrances: heading, then text, then picture ---------- */
  const reveals = document.querySelectorAll('[data-reveal]');
  // stagger siblings inside the same section
  document.querySelectorAll('section').forEach((sec) => {
    sec.querySelectorAll('[data-reveal]').forEach((el, i) => el.style.setProperty('--d', `${i * 80}ms`));
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
    window.addEventListener('load', () => setTimeout(() => {
      reveals.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
    }, 2500));
  } else reveals.forEach((el) => el.classList.add('is-in'));

  /* ---------- hero: the open notebook crossfades through its day ---------- */
  const states = [...document.querySelectorAll('.hero-stage .app-state')];
  let at = 0, timer = null, visible = true;
  const step = () => {
    states[at].classList.remove('is-on');
    at = (at + 1) % states.length;
    states[at].classList.add('is-on');
  };
  const run = () => {
    clearInterval(timer); timer = null;
    if (reduce.matches || document.hidden || !visible) return;
    timer = setInterval(step, 5600);
  };
  if (states.length) {
    const stage = document.querySelector('.hero-stage');
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(stage);
    document.addEventListener('visibilitychange', run);
    reduce.addEventListener?.('change', () => { if (reduce.matches) { states.forEach((s, i) => s.classList.toggle('is-on', i === 0)); at = 0; } run(); });
    run();
  }

  /* ---------- the live note: write a heading and a definition, get a card ---------- */
  const input = document.getElementById('note-input');
  const deck = document.getElementById('deck');
  const tabs = [...document.querySelectorAll('.tab')];
  let side = 'front';

  const ends = /[.?!:;]$/;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const term = (t) => {
    const w = t.trim();
    const lower = /^[A-Z][a-z]/.test(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w;
    if (/\s/.test(lower)) return (/^[aeiou]/i.test(lower) ? 'an ' : 'a ') + lower;
    return lower;
  };

  function cardsFrom(lines) {
    const cards = [];
    let head = null, used = false;
    lines.forEach((line, i) => {
      if (i === 0) return; // the note's title
      if (!ends.test(line)) { head = line; used = false; return; }
      const needs = line.match(/^needs (an? |the )?(.+?), or (?:it |else )?(.+?)\.?$/i);
      if (needs) { cards.push([`What happens without ${needs[1] || ''}${needs[2]}?`, `It ${needs[3]}.`]); return; }
      const isY = line.match(/^(an? |the )?([^,]{2,40}?) (is|are|means) (.+?)\.?$/i);
      if (isY && (!head || used)) {
        const what = (isY[1] || '') + isY[2];
        cards.push([`What ${isY[3] === 'are' ? 'are' : 'is'} ${what.charAt(0).toLowerCase() + what.slice(1)}?`, cap(isY[4]) + '.']);
        return;
      }
      if (head && !used) { cards.push([`What is ${term(head)}?`, line]); used = true; }
    });
    return cards;
  }

  function render(cards, fresh) {
    const old = new Set([...deck.querySelectorAll('.face.front')].map((f) => f.lastChild.textContent));
    deck.innerHTML = '';
    cards.forEach(([front, back]) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'card';
      b.setAttribute('aria-pressed', side === 'back' ? 'true' : 'false');
      b.innerHTML = '<span class="face front"><span class="side">Front</span></span><span class="face back"><span class="side">Back</span></span>';
      b.querySelector('.front').append(document.createTextNode(front));
      b.querySelector('.back').append(document.createTextNode(back));
      if (fresh && !old.has(front) && !reduce.matches) li.className = 'deck-new';
      li.append(b); deck.append(li);
    });
    if (!cards.length) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="face front" style="font-weight:400;color:#75716c"><span class="side">Front</span>Add a heading, then a line that ends with a full stop.</span>';
      deck.append(li);
    }
  }

  function read() {
    // keep the editor's blocks styled: first line is the title, a line without a full stop is a heading
    const blocks = [...input.childNodes].filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()));
    blocks.forEach((n, i) => {
      if (n.nodeType !== 1) return;
      const t = n.textContent.trim();
      n.classList.toggle('t', i === 0);
      n.classList.toggle('h', i > 0 && t !== '' && !ends.test(t));
    });
    const lines = input.innerText.split('\n').map((s) => s.trim()).filter(Boolean);
    return lines;
  }

  if (input && deck) {
    input.setAttribute('contenteditable', 'true');
    input.setAttribute('role', 'textbox');
    input.setAttribute('aria-multiline', 'true');
    input.setAttribute('spellcheck', 'false');
    let pending;
    input.addEventListener('input', () => {
      clearTimeout(pending);
      pending = setTimeout(() => render(cardsFrom(read()), true), 180);
    });
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });
    deck.addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (card) card.setAttribute('aria-pressed', card.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
    tabs.forEach((t) => t.addEventListener('click', () => {
      side = t.dataset.side;
      tabs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
      deck.querySelectorAll('.card').forEach((c) => c.setAttribute('aria-pressed', side === 'back' ? 'true' : 'false'));
    }));
  }

  /* ---------- last call: the new notebook opens on its first page ---------- */
  const form = document.getElementById('new-notebook');
  const name = document.getElementById('nb-name');
  const page = document.getElementById('dialog-page');
  const first = document.getElementById('dialog-form');
  const write = document.getElementById('page-write');
  const crumb = document.getElementById('page-crumb');

  // every "Start a notebook" link brings the visitor to the dialog with the field ready
  document.querySelectorAll('a[href="#start"]').forEach((a) => a.addEventListener('click', () => {
    if (a.dataset.plan) { const r = form.querySelector(`input[value="${a.dataset.plan}"]`); if (r) r.checked = true; }
    setTimeout(() => { if (!first.hidden) name.focus({ preventScroll: true }); }, reduce.matches ? 0 : 500);
  }));

  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const module = name.value.trim() || 'Untitled';
    crumb.textContent = module;
    write.dataset.module = module;
    first.hidden = true;
    page.hidden = false;
    write.focus();
  });
})();
