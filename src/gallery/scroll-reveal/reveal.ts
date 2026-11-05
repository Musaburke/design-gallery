// Scroll motion: word-split headings and staggered blocks.
// Content is always in the DOM and visible without JS; this only adds the travel.
// Pass `scroller` to watch a scrolling box instead of the page.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Wrap each word of [data-split] elements so they can rise in one after another.
function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = '1';
  let i = 0;
  const walk = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.append(part); continue; }
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          inner.style.setProperty('--i', String(i++));
          inner.textContent = part;
          w.append(inner);
          frag.append(w);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && !(child as HTMLElement).matches('br')) {
        walk(child);
      }
    }
  };
  walk(el);
}

export function initReveals(root: HTMLElement, scroller: HTMLElement | null = null) {
  root.querySelectorAll<HTMLElement>('[data-split]').forEach(splitWords);
  const targets = root.querySelectorAll<HTMLElement>('[data-reveal], [data-split]');
  if (reduce) { targets.forEach((t) => t.classList.add('in')); return () => {}; }
  root.classList.add('armed'); // hide-until-revealed styles only apply once JS has run
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    },
    { root: scroller, rootMargin: '0px 0px -12% 0px' }
  );
  targets.forEach((t) => io.observe(t));

  // Replay: hide everything again and watch from the top.
  return () => {
    targets.forEach((t) => { t.classList.remove('in'); io.unobserve(t); });
    if (scroller) scroller.scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => targets.forEach((t) => io.observe(t))));
  };
}
