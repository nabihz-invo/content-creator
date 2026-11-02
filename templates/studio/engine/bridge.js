// Studio engine → pipeline timeline contract (docs/CONTRACTS.md §10, P5-T01).
// Loaded after the engine; once the page's reel/carousel is built and every
// asset is ready, it exposes window.__render and sets window.__ready.
(function () {
  var G = window;
  G.addEventListener("load", function () {
    if (!G.SM_READY || typeof G.SM_META !== "function") {
      console.error("studio bridge: the page did not create SM.reel() or SM.carousel()");
      return;
    }
    G.SM_READY.then(function () {
      var m = G.SM_META();
      G.__render = {
        engine: "studio-1",
        kind: m.kind,
        lang: G.SM.lang,
        duration: m.duration,
        fps: m.fps,
        width: m.w,
        height: m.h,
        scenes: m.scenes,
        stills: m.stills,
        cover: m.cover,
        audio: m.audio,
        sfx: m.sfx,
        seek: function (t) {
          return G.SM_SEEK(t);
        },
      };
      G.__ready = true;
      document.body.dataset.ready = "true";
    });
  });
})();
