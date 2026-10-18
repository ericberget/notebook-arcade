/* Injected at document start with a disk snapshot, before the game loads. */
(() => {
  'use strict';
  const values = { ...window.__SKETCHWATER_SAVES__ };
  delete window.__SKETCHWATER_SAVES__;
  let revision = 0, committed = 0, chain = Promise.resolve();
  const send = body => window.webkit.messageHandlers.park.postMessage(body);
  const storage = {
    getItem(key) { return Object.hasOwn(values, key) ? values[key] : null; },
    setItem(key, value) {
      if (!/^splash-line-park-v1(?:-backup|-previous-park)?$/.test(key)) throw new Error('Unknown save slot');
      if (window.SplashProgress) window.SplashProgress.normalize(JSON.parse(value));
      values[key] = String(value); revision++;
    },
    flush() {
      if (revision === committed) return chain;
      const target = revision, snapshot = { ...values };
      // Serialize writes. A failed attempt must not prevent a later retry.
      chain = chain.catch(() => {}).then(() => send({ action: 'save', values: snapshot })).then(() => { committed = target; });
      return chain;
    }
  };
  window.SketchwaterNative = Object.freeze({ storage, exportPark: json => send({ action: 'export', json }) });
})();
