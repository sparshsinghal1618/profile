/* =============================================================
   SPARSH.S — PEAR-STYLE SCROLL MOTION ENGINE
   -------------------------------------------------------------
   A single requestAnimationFrame pass that reads element
   geometry and writes two custom properties per element:

     --p   enter progress (0 → 1) as the element rises into view
     --e   exit progress  (0 → 1) as the element scrolls past

   All visual mapping lives in transitions.css, so no inline
   transform/filter is ever written and existing :hover states
   keep working untouched.
   ============================================================= */
(() => {
  const root = document.documentElement;
  if (!root.classList.contains("motion-js")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- registry ------------------------------------- */
  const items = [];
  const seen = new WeakSet();

  function register(el, opts = {}) {
    if (!el || seen.has(el)) return;
    seen.add(el);
    el.style.setProperty("--p", "0");
    el.style.setProperty("--e", "0");
    items.push({
      el,
      p: 0,
      e: 0,
      lastP: -1,
      lastE: -1,
      offset: opts.offset || 0,
      exit: opts.exit !== false,
      settled: false
    });
  }

  /* ---------- 1. split headings into words + chars ---------- */
  function splitHeading(el) {
    if (el.dataset.mSplit === "done") return;
    el.dataset.mSplit = "done";

    let index = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const text = child.nodeValue;
          if (!text) return;
          const frag = document.createDocumentFragment();
          text.split(/(\s+)/).forEach(token => {
            if (!token) return;
            if (/^\s+$/.test(token)) { frag.appendChild(document.createTextNode(" ")); return; }
            const word = document.createElement("span");
            word.className = "m-word";
            [...token].forEach(ch => {
              const span = document.createElement("span");
              span.className = "m-char";
              span.style.setProperty("--i", String(index++));
              span.textContent = ch;
              word.appendChild(span);
            });
            frag.appendChild(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);

    el.classList.add("m-split");
    // keep the whole wipe tight, however long the headline is,
    // and make the run finish exactly at --p: 1
    const stagger = Math.min(.03, .55 / Math.max(1, index));
    el.style.setProperty("--m-stagger", stagger.toFixed(4));
    el.style.setProperty("--m-total", (1 + index * stagger).toFixed(4));
    register(el, { exit: true });
  }

  /* ---------- 2. element registration ----------------------- */

  // containers currently animated by the old reveal / chapterArrive
  // system — hand them over to the new layer so nothing fights.
  const NEUTRALIZE = [
    ".section-heading", ".chapter-index", ".dev-layout", ".motion-head",
    ".design-head", ".repos-head", ".playground-head", ".about-layout",
    ".toolkit-head", ".contact-content", ".work-head", ".now-head", ".process-head"
  ].join(",");

  function initHeadings(scope = document) {
    scope.querySelectorAll(".hero-copy h1, .section-pad h2").forEach(h => {
      if (h.closest(".project-dialog, .lightbox, .lab-panel")) return;
      if (h.dataset.mSplit === "done") return;
      splitHeading(h);
    });
  }

  // masked media
  const MEDIA = [
    [".work-cover", true],
    [".repo-cover", false],
    [".about-portrait", false],
    [".film-frame-video", false],
    [".poster-output", false]
  ];

  function initMedia(scope = document) {
    MEDIA.forEach(([sel, zoom]) => {
      scope.querySelectorAll(sel).forEach(el => {
        if (el.classList.contains("m-media")) return;
        el.classList.add("m-media");
        if (zoom) el.classList.add("m-media-zoom");
        register(el, { exit: true });
      });
    });
  }

  // block reveals (staggered by grid position)
  const FADE = [
    ".work-card", ".repo-card", ".lab-panel", ".now-card", ".process-track li",
    ".principle-list li", ".capability-list>div", ".age-card", ".currently>div",
    ".currently-into", ".marquee", ".tool-groups>div", ".contact-bottom",
    ".repo-status", ".playground-head>p", ".work-head>p", ".now-head>p", ".process-head>p"
  ].join(",");

  function initFade(scope = document) {
    scope.querySelectorAll(FADE).forEach(el => {
      if (el.classList.contains("m-fade")) return;
      const parent = el.parentElement;
      const idx = parent ? [...parent.children].indexOf(el) : 0;
      el.classList.add("m-fade");
      register(el, { offset: Math.min(idx, 5) * 46, exit: false });
    });
  }

  // CTA wipes
  function initCta(scope = document) {
    scope.querySelectorAll(".button, .text-link").forEach(el => {
      if (el.classList.contains("m-cta")) return;
      el.classList.add("m-cta");
      register(el, { exit: false });
    });
  }

  /* ---------- 3. the loop ---------------------------------- */
  let raf = 0;
  let running = false;
  let started = false;

  function measureAndWrite() {
    const vh = window.innerHeight || 1;
    let moving = false;

    // READ (all geometry first — avoids layout thrash)
    const frames = items.map(item => {
      const r = item.el.getBoundingClientRect();
      return { item, top: r.top, bottom: r.bottom, height: r.height };
    });

    // WRITE
    for (const f of frames) {
      const item = f.item;
      const anchor = f.top + Math.min(f.height, vh) * .22 + item.offset;
      const tp = easeOut(clamp((vh - anchor) / (vh * .42)));

      let te = 0;
      if (item.exit) {
        te = easeInOut(clamp((vh * .08 - (f.bottom + item.offset)) / (vh * .45)));
        if (te > .999) te = 1;
      }

      item.p += (tp - item.p) * .18;
      item.e += (te - item.e) * .18;
      if (Math.abs(tp - item.p) < .0006) item.p = tp;
      if (Math.abs(te - item.e) < .0006) item.e = te;

      if (Math.abs(item.p - item.lastP) > .0004 || Math.abs(item.e - item.lastE) > .0004) {
        item.el.style.setProperty("--p", item.p.toFixed(4));
        item.el.style.setProperty("--e", item.e.toFixed(4));
        item.lastP = item.p;
        item.lastE = item.e;
        moving = true;
      }

      const done = item.p >= tp - .0006 && Math.abs(item.e - te) < .002;
      if (done !== item.settled) {
        item.settled = done;
        item.el.classList.toggle("is-settled", done);
      }
      if (!done) moving = true;
    }
    return moving;
  }

  function tick() {
    const moving = measureAndWrite();
    if (moving) {
      raf = requestAnimationFrame(tick);
    } else {
      running = false;
      raf = 0;
    }
  }

  function start() {
    if (running || !started) return;
    running = true;
    raf = requestAnimationFrame(tick);
  }

  /* ---------- 4. boot -------------------------------------- */
  function boot() {
    try {
      document.querySelectorAll(NEUTRALIZE).forEach(el => el.classList.add("m-own"));
      initHeadings();
      initMedia();
      initFade();
      initCta();
    } catch (err) {
      // never let motion hide content
      root.classList.remove("motion-js");
      return;
    }
    started = true;

    // re-scan when the GitHub repo gallery injects its cards
    const grid = document.getElementById("repoGrid");
    if (grid && "MutationObserver" in window) {
      let queued = false;
      new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          initMedia(grid);
          initFade(grid);
          initCta(grid);
          start();
        });
      }).observe(grid, { childList: true, subtree: true });
    }

    ["scroll", "resize", "orientationchange"].forEach(evt =>
      window.addEventListener(evt, start, { passive: true })
    );
    start();
  }

  // Wait for the intro overlay so the hero assembles *after* it lifts.
  const intro = document.getElementById("intro");
  const introGone = () => !intro || intro.classList.contains("hidden");

  if (introGone()) {
    boot();
  } else if ("MutationObserver" in window) {
    const obs = new MutationObserver(() => {
      if (introGone()) { obs.disconnect(); boot(); }
    });
    obs.observe(intro, { attributes: true, attributeFilter: ["class"] });
    window.setTimeout(() => { obs.disconnect(); if (!started) boot(); }, 2400);
  } else {
    boot();
  }
})();
