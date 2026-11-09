// Some demos play themselves in a grid card (anything inside [data-preview]).
// This says when they may: on screen, tab visible, no pointer or focus inside,
// so the demo stops the moment someone reaches for it.

export const playsItself = (root: HTMLElement) =>
  !!root.closest('[data-preview]') && !matchMedia('(prefers-reduced-motion: reduce)').matches;

export function whenFree(root: HTMLElement, onChange: (free: boolean) => void) {
  let visible = false, held = false, free = false;
  const sync = () => {
    const next = visible && !held && !document.hidden;
    if (next === free) return;
    free = next;
    onChange(free);
  };
  const hold = (on: boolean) => { held = on; sync(); };

  new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; sync(); }).observe(root);
  document.addEventListener('visibilitychange', sync);
  root.addEventListener('pointerenter', () => hold(true));
  root.addEventListener('pointerleave', () => hold(false));
  root.addEventListener('focusin', () => hold(true));
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget as Node)) hold(false); });
}
