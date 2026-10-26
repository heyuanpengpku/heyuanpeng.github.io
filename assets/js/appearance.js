(() => {
  "use strict";
  const header = document.querySelector(".site-header");
  let scrollFrame = 0;
  function updateHeader() {
    scrollFrame = 0;
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateHeader);
    },
    { passive: true },
  );
  updateHeader();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (
    reducedMotion.matches ||
    !("IntersectionObserver" in window) ||
    !Element.prototype.animate
  )
    return;
  const animations = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (reducedMotion.matches) return;
        // No persistent hidden styles: content remains readable if scripts fail,
        // an animation is interrupted, or a visitor opens a direct section link.
        const animation = entry.target.animate(
          [
            { opacity: 0.25, transform: "translateY(14px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(
      ".research-strip, .section-heading, .experience-grid, .recognition-grid, .contact-section",
    )
    .forEach((element) => {
      if (element.getBoundingClientRect().top >= window.innerHeight * 0.85)
        observer.observe(element);
    });
  function finishAnimations() {
    observer.disconnect();
    animations.forEach((animation) => animation.finish());
    animations.clear();
  }
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) finishAnimations();
  });
  window.addEventListener("beforeprint", finishAnimations);
})();
