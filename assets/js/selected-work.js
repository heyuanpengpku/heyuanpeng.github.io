(() => {
  "use strict";
  const track = document.getElementById("selected-work-track");
  const previous = document.getElementById("work-previous");
  const next = document.getElementById("work-next");
  if (!track || !previous || !next) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function updateControls() {
    const maximum = track.scrollWidth - track.clientWidth;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= maximum - 2;
    document.querySelector(".work-nav").hidden = maximum <= 2;
    document.querySelectorAll(".work-swipe-hint").forEach((hint) => {
      hint.hidden = maximum <= 2;
    });
  }
  function step(direction) {
    const card = track.querySelector(".featured-paper");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
  }
  function updateLanguage() {
    const chinese = document.documentElement.dataset.language === "zh";
    previous.setAttribute(
      "aria-label",
      chinese ? "向左查看代表作" : "Previous papers",
    );
    next.setAttribute("aria-label", chinese ? "向右查看代表作" : "Next papers");
    track.setAttribute(
      "aria-roledescription",
      chinese ? "轮播展示" : "carousel",
    );
  }
  previous.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  track.addEventListener("scroll", updateControls, { passive: true });
  track.addEventListener("keydown", (event) => {
    if (event.target !== track) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      step(event.key === "ArrowRight" ? 1 : -1);
    }
  });
  if ("ResizeObserver" in window)
    new ResizeObserver(updateControls).observe(track);
  else window.addEventListener("resize", updateControls);
  document.addEventListener("site-language-change", updateLanguage);
  updateLanguage();
  updateControls();
})();
