(() => {
  document.documentElement.classList.add("js");

  // Stamp the slip once, in reading order, when it is on screen.
  const slip = document.querySelector(".slip");
  if (slip) {
    slip.querySelectorAll(".stamp").forEach((s, i) => s.style.setProperty("--i", i));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      slip.classList.add("is-stamped");
    } else {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          slip.classList.add("is-stamped");
          io.disconnect();
        }
      }, { threshold: 0.35 });
      io.observe(slip);
    }
  }

  // Cards flip on press and light the lines they came from.
  const lines = document.querySelectorAll(".note [data-src]");
  const light = (src) => lines.forEach((l) => l.classList.toggle("is-lit", l.dataset.src === src));
  document.querySelectorAll(".ccard").forEach((card) => {
    const front = card.querySelector(".front");
    const back = card.querySelector(".back");
    card.addEventListener("click", () => {
      const on = card.getAttribute("aria-pressed") !== "true";
      card.setAttribute("aria-pressed", String(on));
      front.setAttribute("aria-hidden", String(on));
      back.setAttribute("aria-hidden", String(!on));
    });
    ["pointerenter", "focus"].forEach((ev) => card.addEventListener(ev, () => light(card.dataset.src)));
    ["pointerleave", "blur"].forEach((ev) => card.addEventListener(ev, () => light(null)));
  });
})();
