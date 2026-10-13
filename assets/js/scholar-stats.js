(() => {
  "use strict";
  const metrics = document.querySelector(".metrics");
  const timestamp = document.getElementById("scholar-updated");
  if (!metrics || !timestamp) return;
  const fields = {
    total_cit: "citedby",
    h_index: "hindex",
    i10_index: "i10index",
  };
  const cacheKey = `scholar-stats-v1:${metrics.dataset.scholarId}`;
  const refreshInterval = 15 * 60 * 1000;
  let currentTime = Date.parse(timestamp.dateTime) || 0;
  let lastAttempt = 0;
  let refreshing = false;

  function renderTimestamp() {
    if (!currentTime) return;
    const locale =
      document.documentElement.dataset.language === "zh" ? "zh-CN" : "en-GB";
    timestamp.textContent =
      new Intl.DateTimeFormat(locale, {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date(currentTime)) + " UTC+8";
  }

  function validate(data) {
    if (
      !data ||
      data.schema_version !== 1 ||
      data.scholar_id !== metrics.dataset.scholarId
    )
      return false;
    if (
      !Object.values(fields).every(
        (key) => Number.isSafeInteger(data[key]) && data[key] >= 0,
      )
    )
      return false;
    if (data.hindex ** 2 > data.citedby || data.i10index * 10 > data.citedby)
      return false;
    if (
      typeof data.updated !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(data.updated)
    )
      return false;
    const updated = Date.parse(data.updated);
    return Number.isFinite(updated) && updated <= Date.now() + 5 * 60 * 1000;
  }

  function applySnapshot(data) {
    if (!validate(data)) throw new Error("Invalid Scholar snapshot");
    const updated = Date.parse(data.updated);
    // A real correction can decrease a count. Freshness is determined by the
    // successful-fetch timestamp, never by the magnitude of the counters.
    if (updated <= currentTime) return;
    Object.entries(fields).forEach(([id, key]) => {
      document.getElementById(id).textContent = String(data[key]);
    });
    currentTime = updated;
    timestamp.dateTime = data.updated;
    renderTimestamp();
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      /* Storage is optional. */
    }
  }

  async function refresh() {
    if (refreshing || document.hidden) return;
    refreshing = true;
    lastAttempt = Date.now();
    try {
      for (const address of [
        metrics.dataset.statsUrl,
        metrics.dataset.statsFallbackUrl,
      ]) {
        if (!address) continue;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const url = new URL(address);
          url.searchParams.set("t", String(Date.now()));
          const response = await fetch(url, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Scholar snapshot unavailable");
          applySnapshot(await response.json());
          break;
        } catch (error) {
          // Try the alternate delivery host. If both fail, leave both the
          // previous values and their truthful successful-sync time untouched.
        } finally {
          clearTimeout(timeout);
        }
      }
    } finally {
      refreshing = false;
    }
  }

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) applySnapshot(JSON.parse(cached));
  } catch (error) {
    /* Discard invalid cache entries and keep the baked snapshot. */
  }
  renderTimestamp();
  document.addEventListener("site-language-change", renderTimestamp);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Date.now() - lastAttempt >= refreshInterval)
      refresh();
  });
  setInterval(refresh, refreshInterval);
  refresh();
})();
