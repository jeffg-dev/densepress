// Runs in the article's tab after lib/Readability.js. The last expression is the return value.
(() => {
  try {
    // Promote common lazy-load attributes so images survive extraction.
    const clone = document.cloneNode(true);
    clone.querySelectorAll("img").forEach((img) => {
      const lazy = img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || img.getAttribute("data-original");
      if (lazy && (!img.getAttribute("src") || img.getAttribute("src").startsWith("data:"))) {
        img.setAttribute("src", lazy);
      }
      const lazySet = img.getAttribute("data-srcset");
      if (lazySet && !img.getAttribute("srcset")) img.setAttribute("srcset", lazySet);
    });

    const article = new Readability(clone, { keepClasses: false }).parse();
    if (!article || !article.content) {
      return { error: "Couldn't find an article on this page." };
    }
    return {
      title: article.title || document.title,
      byline: article.byline || "",
      siteName: article.siteName || location.hostname.replace(/^www\./, ""),
      published: article.publishedTime || "",
      lang: article.lang || document.documentElement.lang || "en",
      url: location.href,
      content: article.content,
    };
  } catch (e) {
    return { error: "Extraction failed: " + e.message };
  }
})();
