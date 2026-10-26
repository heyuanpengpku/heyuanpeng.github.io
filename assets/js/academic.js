(() => {
  "use strict";
  const root = document.documentElement;
  const languageButton = document.getElementById("site-lang-toggle");
  const search = document.getElementById("paper-search");
  const rows = Array.from(document.querySelectorAll(".publication-row"));
  const yearButtons = Array.from(
    document.querySelectorAll(".year-filters button"),
  );
  const showButton = document.querySelector(".show-publications");
  const status = document.getElementById("publication-status");
  const emptyState = document.querySelector(".publication-empty");
  const previewCount = 6;
  let selectedYear = "all";
  let expanded = false;
  const isChinese = () => root.dataset.language === "zh";

  function filterPublications() {
    const query = search.value.trim().toLocaleLowerCase();
    const matches = rows.filter(
      (row) =>
        (selectedYear === "all" || row.dataset.year === selectedYear) &&
        row.dataset.search.toLocaleLowerCase().includes(query),
    );
    const filtered = selectedYear !== "all" || query !== "";
    const visible = new Set(
      expanded || filtered ? matches : matches.slice(0, previewCount),
    );
    rows.forEach((row) => {
      row.hidden = !visible.has(row);
    });
    yearButtons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.year === selectedYear),
      ),
    );
    emptyState.hidden = matches.length !== 0;
    showButton.hidden = filtered || matches.length <= previewCount;
    showButton.setAttribute("aria-expanded", String(expanded));
    const showLabel = isChinese()
      ? expanded
        ? "收起列表"
        : `查看全部 ${rows.length} 篇论文`
      : expanded
        ? "Show fewer publications"
        : `View all ${rows.length} publications`;
    const showArrow = document.createElement("span");
    showArrow.className = `link-arrow ${expanded ? "arrow-up" : "arrow-down"}`;
    showArrow.setAttribute("aria-hidden", "true");
    showArrow.textContent = expanded ? "↑" : "↓";
    showButton.replaceChildren(document.createTextNode(showLabel), showArrow);
    status.hidden = false;
    status.textContent = isChinese()
      ? `显示 ${visible.size} 篇，共 ${matches.length} 篇${filtered ? "符合筛选条件" : "论文"}`
      : `Showing ${visible.size} of ${matches.length} ${filtered ? "matching " : ""}publications`;
  }

  function updateLanguage() {
    const zh = isChinese();
    root.lang = zh ? "zh-CN" : "en";
    languageButton.setAttribute(
      "aria-label",
      zh ? "Switch to English" : "切换到中文",
    );
    search.placeholder = zh
      ? "搜索论文标题或会议期刊…"
      : "Search title or venue…";
    document
      .querySelector(".year-filters")
      .setAttribute(
        "aria-label",
        zh ? "按年份筛选论文" : "Filter publications by year",
      );
    filterPublications();
    document.dispatchEvent(new Event("site-language-change"));
  }
  languageButton.addEventListener("click", () => {
    root.dataset.language = isChinese() ? "en" : "zh";
    try {
      localStorage.setItem("site-lang", root.dataset.language);
    } catch (error) {
      /* Storage is optional. */
    }
    updateLanguage();
  });
  yearButtons.forEach((button) =>
    button.addEventListener("click", () => {
      selectedYear = button.dataset.year;
      expanded = false;
      filterPublications();
    }),
  );
  search.addEventListener("input", filterPublications);
  showButton.addEventListener("click", () => {
    expanded = !expanded;
    filterPublications();
    if (!expanded)
      document
        .getElementById("publications")
        .scrollIntoView({ block: "start" });
  });
  document.getElementById("reset-search").addEventListener("click", () => {
    search.value = "";
    selectedYear = "all";
    expanded = false;
    filterPublications();
    search.focus({ preventScroll: true });
  });
  document.querySelector(".publication-controls").hidden = false;
  updateLanguage();

  // Keep direct links to individual publications usable, including older work.
  function revealLinkedPublication() {
    const id = location.hash.slice(1);
    if (!/^paper-\d+$/.test(id)) return;
    const row = document.getElementById(id);
    if (!row) return;
    selectedYear = "all";
    search.value = "";
    expanded = true;
    filterPublications();
    requestAnimationFrame(() => row.scrollIntoView({ block: "start" }));
  }
  window.addEventListener("hashchange", revealLinkedPublication);
  revealLinkedPublication();

  const menuButton = document.querySelector(".menu-button");
  const mobileNav = document.getElementById("mobile-nav");
  function closeMenu() {
    menuButton.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
  }
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    mobileNav.hidden = !open;
  });
  mobileNav
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !mobileNav.hidden) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
  });
  window
    .matchMedia("(min-width: 641px)")
    .addEventListener("change", (event) => {
      if (event.matches) closeMenu();
    });

  // Resolve the current section from its position, including large scroll jumps
  // and section resizing. Intersection-only updates can retain an old selection.
  const navigation = Array.from(document.querySelectorAll(".desktop-nav a"))
    .map((link) => ({ link, section: document.querySelector(link.hash) }))
    .filter((item) => item.section);
  let navigationFrame = 0;
  function updateNavigation() {
    navigationFrame = 0;
    if (!navigation.length) return;
    const header = document.querySelector(".site-header");
    const threshold = (header ? header.getBoundingClientRect().height : 0) + 32;
    let active = navigation[0];
    navigation.forEach((item) => {
      if (item.section.getBoundingClientRect().top <= threshold) active = item;
    });
    if (
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 2
    ) {
      active = navigation[navigation.length - 1];
    }
    navigation.forEach((item) => {
      if (item === active) item.link.setAttribute("aria-current", "location");
      else item.link.removeAttribute("aria-current");
    });
  }
  function scheduleNavigationUpdate() {
    if (!navigationFrame)
      navigationFrame = requestAnimationFrame(updateNavigation);
  }
  window.addEventListener("scroll", scheduleNavigationUpdate, {
    passive: true,
  });
  window.addEventListener("resize", scheduleNavigationUpdate);
  document.addEventListener("site-language-change", scheduleNavigationUpdate);
  if ("ResizeObserver" in window) {
    new ResizeObserver(scheduleNavigationUpdate).observe(
      document.getElementById("main"),
    );
  }
  updateNavigation();

  // A printed copy includes the complete CV and publication list.
  let previouslyClosed = [];
  window.addEventListener("beforeprint", () => {
    previouslyClosed = Array.from(
      document.querySelectorAll("details:not([open])"),
    );
    previouslyClosed.forEach((details) => {
      details.open = true;
    });
  });
  window.addEventListener("afterprint", () => {
    previouslyClosed.forEach((details) => {
      details.open = false;
    });
    previouslyClosed = [];
  });
})();
