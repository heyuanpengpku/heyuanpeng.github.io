(() => {
  const filterRoot = document.querySelector("[data-publications-filters]");
  if (!filterRoot) {
    return;
  }

  const yearGroups = Array.from(
    document.querySelectorAll(".pub-year-group[data-year]")
  );

  if (!yearGroups.length) {
    return;
  }

  const createButton = (label, year) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pub-filter-button";
    button.dataset.filterYear = year;
    button.textContent = label;
    return button;
  };

  yearGroups.forEach((group) => {
    const paperCount = group.querySelectorAll(".paper-box").length;
    const summary = group.querySelector("summary");

    if (summary && !summary.querySelector(".pub-year-count")) {
      const count = document.createElement("span");
      count.className = "pub-year-count";
      count.textContent = `${paperCount} paper${paperCount === 1 ? "" : "s"}`;
      summary.appendChild(count);
    }
  });

  const buttons = [
    createButton("All", "all"),
    ...yearGroups.map((group) => createButton(group.dataset.year, group.dataset.year)),
  ];

  buttons.forEach((button) => filterRoot.appendChild(button));

  const setActiveYear = (activeYear) => {
    buttons.forEach((button) => {
      const isActive = button.dataset.filterYear === activeYear;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    yearGroups.forEach((group) => {
      const matches = activeYear === "all" || group.dataset.year === activeYear;
      group.hidden = !matches;

      if (matches && activeYear !== "all") {
        group.open = true;
      }
    });
  };

  filterRoot.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter-year]");
    if (!button) {
      return;
    }

    setActiveYear(button.dataset.filterYear);
  });

  setActiveYear("all");
})();
