// Works in Firefox (browser.*) and Chrome (chrome.*); both return promises in MV3.
const api = globalThis.browser ?? globalThis.chrome;

// Toolbar click: extract the article from the active tab, stash it, open the print view.
api.action.onClicked.addListener(async (tab) => {
  let result;
  try {
    const injected = await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["lib/Readability.js", "extract.js"],
    });
    result = injected[injected.length - 1].result;
  } catch (e) {
    result = { error: "Couldn't read this page (" + e.message + "). Browser-internal pages and extension stores can't be accessed by extensions." };
  }

  const id = "article-" + Date.now();
  await api.storage.local.set({ [id]: result || { error: "No result from page." } });
  await api.tabs.create({
    url: api.runtime.getURL("reader.html?id=" + id),
    index: tab.index + 1,
  });
});
