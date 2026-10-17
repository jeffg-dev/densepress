(async () => {
  const api = globalThis.browser ?? globalThis.chrome ?? null;
  const hasStorage = !!(api && api.storage && api.storage.local);
  const DEFAULTS = { columns: true, images: true };

  // ---- Settings (persisted) ----
  let opts = { ...DEFAULTS };
  try { if (hasStorage) opts = { ...DEFAULTS, ...(await api.storage.local.get("dp-opts"))["dp-opts"] }; } catch {}
  const colBox = document.getElementById("opt-columns");
  const imgBox = document.getElementById("opt-images");
  const apply = () => {
    document.body.classList.toggle("columns", opts.columns);
    document.body.classList.toggle("no-images", !opts.images);
    colBox.checked = opts.columns;
    imgBox.checked = opts.images;
    updatePages();
  };
  const save = () => { try { hasStorage && api.storage.local.set({ "dp-opts": opts }); } catch {} };
  colBox.addEventListener("change", () => { opts.columns = colBox.checked; save(); apply(); });
  imgBox.addEventListener("change", () => { opts.images = imgBox.checked; save(); apply(); });
  document.getElementById("print").addEventListener("click", async () => {
    await document.fonts.ready;
    window.print();
  });

  // Rough page estimate (screen preview height / letter content height)
  function updatePages() {
    requestAnimationFrame(() => {
      const page = document.getElementById("page");
      const contentPx = page.scrollHeight - 2 * 0.5 * 96;
      const pages = Math.max(1, Math.ceil(contentPx / (10 * 96)));
      document.getElementById("pages").textContent = "≈ " + pages + (pages === 1 ? " page" : " pages");
    });
  }

  // ---- Load the article ----
  let data = window.__DP_TEST_DATA || null;
  const id = new URLSearchParams(location.search).get("id");
  if (!data && hasStorage && id) {
    data = (await api.storage.local.get(id))[id];
    api.storage.local.remove(id);
  }
  const bodyEl = document.getElementById("body");

  if (!data || data.error) {
    document.getElementById("title").textContent = "Nothing to print";
    const p = document.createElement("p");
    p.className = "dp-error";
    p.textContent = (data && data.error) || "No article data. Open an article and click the DensePress button.";
    bodyEl.appendChild(p);
    apply();
    return;
  }

  document.title = data.title;
  document.documentElement.lang = data.lang || "en";
  document.getElementById("title").textContent = data.title;

  const meta = document.getElementById("meta");
  const bits = [data.siteName, data.byline, formatDate(data.published)].filter(Boolean);
  const seen = new Set();
  meta.textContent = bits.filter((b) => !seen.has(b.toLowerCase()) && seen.add(b.toLowerCase())).join(" · ");
  const url = document.createElement("div");
  url.className = "url";
  url.textContent = data.url;
  meta.appendChild(url);

  // ---- Sanitize and insert content ----
  const doc = new DOMParser().parseFromString(data.content, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed, form, link, meta").forEach((n) => n.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || ["style", "class", "width", "height", "align"].includes(name)) el.removeAttribute(attr.name);
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(attr.value)) el.removeAttribute(attr.name);
    }
  });
  // The page title usually repeats as the first heading; drop it.
  const firstHeading = doc.body.querySelector("h1, h2");
  if (firstHeading && norm(firstHeading.textContent) === norm(data.title)) firstHeading.remove();
  // Images: load eagerly, drop fixed sizes so they scale to the column.
  doc.querySelectorAll("img").forEach((img) => {
    img.removeAttribute("loading");
    img.removeAttribute("width");
    img.removeAttribute("height");
    img.setAttribute("decoding", "sync");
  });

  bodyEl.replaceChildren(...doc.body.childNodes);
  const firstP = bodyEl.querySelector("p");
  if (firstP) firstP.classList.add("dp-first");
  apply();
  document.fonts.ready.then(updatePages);
  bodyEl.querySelectorAll("img").forEach((img) => img.addEventListener("load", updatePages, { once: true }));

  function norm(s) { return (s || "").replace(/\s+/g, " ").trim().toLowerCase(); }
  function formatDate(s) {
    if (!s) return "";
    const d = new Date(s);
    if (isNaN(d)) return "";
    // A bare YYYY-MM-DD parses as UTC midnight; format it in UTC so it doesn't slip a day.
    const tz = /^\d{4}-\d{2}-\d{2}$/.test(s.trim()) ? "UTC" : undefined;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: tz });
  }
})();
