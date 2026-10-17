/* =============================================================
   SPARSH.S — SCROLL CHOREOGRAPHY + ARTCRAFT-STYLE RULER
   -------------------------------------------------------------
   Companion to choreo.css. Three things:

     1. Right-side ruler  — builds the rail DOM, maps scroll
        0..100% onto it, drives the needle + rolling-digit
        readout, the hover ghost line, and click / drag to jump.
        Toggled by data-ruler="on" on <html>, which hides the
        native scrollbar (ArtCraft's exact mechanism).
     2. Top progress rail — leading spark that tracks scroll.
     3. Draw choreography — wraps every .section-pad in a .choreo
        frame (hairline + corner ticks) and marks it .in-view.

   The ruler only runs behind a gate identical to ArtCraft's:
   fine pointer + hover + >=768px + prefers-reduced-motion:
   no-preference — and it is torn down if that ever stops
   being true (resize, motion setting change).

   Everything here is additive: delete this file, choreo.css,
   and the two tags in index.html to go back to stock.
   ============================================================= */
(function () {
  "use strict";

  var doc = document;
  var win = window;

  /* ---------------------------------------------------------------
     0. GATE
     --------------------------------------------------------------- */
  var GATE =
    "(min-width: 768px) and (pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)";

  var clamp = function (v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  };
  var clamp01 = function (v) {
    return clamp(v, 0, 1);
  };

  /* ---------------------------------------------------------------
     1. DRAW CHOREOGRAPHY  (runs regardless of the ruler gate)
     --------------------------------------------------------------- */
  var sections = doc.querySelectorAll(
    ".section-pad:not(.choreo-section), .section-pad:not(.choreo-section) ~ .section-pad"
  );

  // Build a scoped list: every .section-pad that is not yet framed.
  var frameTargets = Array.prototype.filter.call(
    doc.querySelectorAll(".section-pad"),
    function (el) {
      return !el.classList.contains("choreo-section");
    }
  );

  frameTargets.forEach(function (sec) {
    var frame = doc.createElement("div");
    frame.className = "choreo";
    frame.setAttribute("aria-hidden", "true");
    frame.innerHTML = "<i></i><i></i>";
    sec.insertBefore(frame, sec.firstChild);
    sec.classList.add("choreo-section");
  });

  if (frameTargets.length && "IntersectionObserver" in win) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.06 }
    );
    frameTargets.forEach(function (sec) {
      io.observe(sec);
    });
  } else {
    frameTargets.forEach(function (sec) {
      sec.classList.add("in-view");
    });
  }

  /* ---------------------------------------------------------------
     2. TOP PROGRESS SPARK
     --------------------------------------------------------------- */
  var rootStyle = doc.documentElement.style;

  var spark = doc.createElement("div");
  spark.className = "scroll-spark";
  spark.setAttribute("aria-hidden", "true");
  doc.body.appendChild(spark);

  var ticking = false;

  function paintScroll() {
    ticking = false;
    var docEl = doc.documentElement;
    var max = Math.max(
      1,
      (docEl.scrollHeight || 0) - (win.innerHeight || 0)
    );
    var p = clamp01((win.scrollY || win.pageYOffset || 0) / max);
    rootStyle.setProperty("--scroll-progress", String(p));
    if (rulerState.enabled) {
      updateRuler(p);
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      win.requestAnimationFrame(paintScroll);
    }
  }

  win.addEventListener("scroll", onScroll, { passive: true });
  win.addEventListener("resize", onScroll, { passive: true });

  /* ---------------------------------------------------------------
     3. THE RULER
     --------------------------------------------------------------- */
  var RULER = {
    // from ArtCraft rulerLook / rulerMotion
    edgePad: 12, // inset from nav bottom and viewport bottom
    navH: 78, // our fixed header height
    minorPct: 1, // one tick per 1%
    labelPct: 5, // % label every 5%
    introStagger: 10, // ms between ticks during draw-in
    needleFadePct: 3, // needle is quiet at the very top
  };

  var rulerState = {
    enabled: false,
    el: null,
    inner: null,
    needle: null,
    readout: null,
    digits: [],
    ghost: null,
    lastP: -1,
    prevDigits: [-1, -1, -1],
    lastMove: null,
    dragging: false,
    dragMoved: 0,
    padTop: 0,
    padBottom: 0,
    span: 1,
    media: null,
    onChange: null,
  };

  function buildRuler() {
    var el = doc.createElement("div");
    el.className = "ruler";
    el.id = "scrollRuler";
    el.setAttribute("role", "scrollbar");
    el.setAttribute("aria-orientation", "vertical");
    el.setAttribute("aria-valuemin", "0");
    el.setAttribute("aria-valuemax", "100");
    el.setAttribute("aria-valuenow", "0");
    el.setAttribute("aria-label", "Page scroll position");
    el.setAttribute("tabindex", "0");

    var frost = doc.createElement("div");
    frost.className = "ruler-frost";
    frost.setAttribute("aria-hidden", "true");
    el.appendChild(frost);

    var inner = doc.createElement("div");
    inner.className = "ruler-inner";

    // 0..100 ticks (ArtCraft: minor every 1%, label every 5%)
    var idx = 0;
    for (var p = 0; p <= 100; p += RULER.minorPct) {
      var pct = Math.round(p);
      var major = pct % RULER.labelPct === 0;

      var tick = doc.createElement("span");
      tick.className = "ruler-tick" + (major ? " is-major" : "");
      tick.style.top = pct + "%";
      tick.style.setProperty("--i", String(idx++));
      tick.setAttribute("aria-hidden", "true");
      inner.appendChild(tick);

      if (major) {
        var label = doc.createElement("span");
        label.className = "ruler-label";
        label.style.top = pct + "%";
        label.textContent = String(pct);
        label.setAttribute("aria-hidden", "true");
        inner.appendChild(label);
      }
    }

    // needle: line + rolling 3-column readout + %
    var needle = doc.createElement("div");
    needle.className = "ruler-needle";
    needle.setAttribute("aria-hidden", "true");

    var line = doc.createElement("span");
    line.className = "ruler-line";
    needle.appendChild(line);

    var readout = doc.createElement("span");
    readout.className = "ruler-readout";

    var digits = doc.createElement("span");
    digits.className = "ruler-digits";

    var digitCols = [];
    for (var c = 0; c < 3; c++) {
      var col = doc.createElement("span");
      col.className = "ruler-digit-col";
      col.innerHTML = "<span>0</span><span>1</span><span>2</span>" +
        "<span>3</span><span>4</span><span>5</span><span>6</span>" +
        "<span>7</span><span>8</span><span>9</span>";
      digits.appendChild(col);
      digitCols.push(col);
    }

    var pctSign = doc.createElement("span");
    pctSign.className = "ruler-pct";
    pctSign.textContent = "%";

    readout.appendChild(digits);
    readout.appendChild(pctSign);
    needle.appendChild(readout);
    inner.appendChild(needle);

    var ghost = doc.createElement("div");
    ghost.className = "ruler-ghost";
    ghost.setAttribute("aria-hidden", "true");
    inner.appendChild(ghost);

    el.appendChild(inner);
    doc.body.appendChild(el);

    rulerState.el = el;
    rulerState.inner = inner;
    rulerState.needle = needle;
    rulerState.readout = readout;
    rulerState.digits = digitCols;
    rulerState.ghost = ghost;
    rulerState.lastP = -1;
    rulerState.prevDigits = [-1, -1, -1];
  }

  /* map client Y -> 0..1 of the rail span */
  function railMetrics() {
    var cs = win.getComputedStyle(rulerState.el);
    rulerState.padTop = parseFloat(cs.getPropertyValue("--ruler-pad-top")) || RULER.navH + RULER.edgePad;
    rulerState.padBottom =
      parseFloat(cs.getPropertyValue("--ruler-pad-bottom")) || RULER.edgePad;
    var h = rulerState.el.getBoundingClientRect().height || win.innerHeight;
    rulerState.span = Math.max(1, h - rulerState.padTop - rulerState.padBottom);
  }

  function yToP(clientY) {
    railMetrics();
    return clamp01((clientY - rulerState.padTop) / rulerState.span);
  }

  function setDigits(num) {
    var s = String(num); // "0".."100"
    while (s.length < 3) s = "0" + s;
    for (var i = 0; i < 3; i++) {
      var d = s.charCodeAt(i) - 48;
      if (rulerState.prevDigits[i] !== d) {
        rulerState.prevDigits[i] = d;
        rulerState.digits[i].style.transform =
          "translate3d(0, -" + d + "em, 0)";
      }
    }
  }

  function updateRuler(p) {
    var el = rulerState.el;
    if (!el) return;

    if (Math.abs(p - rulerState.lastP) > 0.00005 || rulerState.lastP < 0) {
      rulerState.lastP = p;
      el.style.setProperty("--ruler-p", String(p));
      el.setAttribute("aria-valuenow", String(Math.round(p * 100)));
      setDigits(Math.round(p * 100));

      // lift the readout near the bottom so it never clips (ArtCraft
      // does the same once the needle gets within ~26px of the edge)
      railMetrics();
      var needleY = rulerState.padTop + p * rulerState.span;
      var vh = el.getBoundingClientRect().height || win.innerHeight;
      if (needleY > vh - 26) {
        rulerState.readout.classList.add("is-above");
      } else {
        rulerState.readout.classList.remove("is-above");
      }
    }
  }

  /* --- pointer: ghost, click-to-jump, drag-to-scrub ------------ */
  function onPointerMove(ev) {
    rulerState.lastMove = { clientY: ev.clientY };
    if (!rulerState.dragging) return;
    rulerState.dragMoved += 1;
    var p = yToP(ev.clientY);
    updateRuler(p);
    jumpTo(p, true);
  }

  function onPointerEnter(ev) {
    if (rulerState.lastMove) showGhost(rulerState.lastMove.clientY);
    else showGhost(ev.clientY);
  }

  function onPointerLeave() {
    rulerState.ghost.classList.remove("is-active");
  }

  function showGhost(clientY) {
    var t = clamp(clientY, rulerState.padTop,
      rulerState.padTop + rulerState.span);
    rulerState.ghost.style.top = t + "px";
    rulerState.ghost.classList.add("is-active");
  }

  function docScrollRange() {
    var docEl = doc.documentElement;
    return Math.max(
      1,
      (docEl.scrollHeight || 0) - (win.innerHeight || 0)
    );
  }

  function jumpTo(p, instant) {
    var top = clamp01(p) * docScrollRange();
    var html = doc.documentElement;
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = instant ? "auto" : "";
    win.scrollTo({ top: top, behavior: instant ? "auto" : "smooth" });
    html.style.scrollBehavior = prev;
  }

  function onPointerDown(ev) {
    if (ev.button !== undefined && ev.button !== 0) return;
    rulerState.dragging = true;
    rulerState.dragMoved = 0;
    rulerState.lastMove = { clientY: ev.clientY };
    try {
      rulerState.el.setPointerCapture(ev.pointerId);
    } catch (e) {}
    ev.preventDefault();
    showGhost(ev.clientY);
  }

  function onPointerUp(ev) {
    var wasDragging = rulerState.dragging;
    rulerState.dragging = false;
    try {
      rulerState.el.releasePointerCapture(ev.pointerId);
    } catch (e) {}
    if (!wasDragging) return;
    if (rulerState.dragMoved <= 3) {
      // a clean click: jump straight to where it landed
      jumpTo(yToP(ev.clientY), false);
    } else {
      jumpTo(yToP(ev.clientY), true);
    }
    rulerState.ghost.classList.remove("is-active");
  }

  /* --- keyboard: the rail is a real scrollbar ------------------ */
  function onKeyDown(ev) {
    var k = ev.key;
    var vh = win.innerHeight;
    var cur = rulerState.lastP < 0 ? 0 : rulerState.lastP;
    var step = 0.02;
    var next = null;

    if (k === "ArrowDown" || k === "ArrowRight") next = cur + step;
    else if (k === "ArrowUp" || k === "ArrowLeft") next = cur - step;
    else if (k === "PageDown") next = cur + (vh * 0.9) / docScrollRange();
    else if (k === "PageUp") next = cur - (vh * 0.9) / docScrollRange();
    else if (k === "Home") next = 0;
    else if (k === "End") next = 1;
    else if (k === " " || k === "Spacebar") next = cur + step * 5;

    if (next === null) return;
    ev.preventDefault();
    jumpTo(clamp01(next), false);
  }

  /* --- enable / disable --------------------------------------- */
  function enableRuler() {
    if (rulerState.enabled) return;
    buildRuler();
    railMetrics();

    var el = rulerState.el;

    el.addEventListener("pointermove", onPointerMove, { passive: true });
    el.addEventListener("pointerenter", onPointerEnter, { passive: true });
    el.addEventListener("pointerleave", onPointerLeave, { passive: true });
    el.addEventListener("pointerdown", onPointerDown, { passive: false });
    el.addEventListener("pointerup", onPointerUp, { passive: true });
    el.addEventListener("pointercancel", onPointerUp, { passive: true });
    el.addEventListener("keydown", onKeyDown);

    // hide the native scrollbar while the ruler owns the right edge
    doc.documentElement.setAttribute("data-ruler", "on");
    rulerState.enabled = true;

    // force the initial scaleX(0) state, then run the draw-in cascade
    void el.offsetHeight;
    win.requestAnimationFrame(function () {
      paintScroll();
      el.classList.add("ruler-ready");
    });
  }

  function disableRuler() {
    if (!rulerState.enabled) return;
    var el = rulerState.el;
    rulerState.enabled = false;
    if (el) {
      el.classList.remove("ruler-ready");
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    rulerState.el = null;
    rulerState.inner = null;
    rulerState.needle = null;
    rulerState.readout = null;
    rulerState.ghost = null;
    rulerState.digits = [];
    rulerState.lastP = -1;
    rulerState.prevDigits = [-1, -1, -1];
    rootStyle.removeProperty("--ruler-p");
    doc.documentElement.removeAttribute("data-ruler");
  }

  rulerState.media = win.matchMedia(GATE);
  rulerState.onChange = function () {
    if (rulerState.media.matches) enableRuler();
    else disableRuler();
  };

  if (rulerState.media.addEventListener) {
    rulerState.media.addEventListener("change", rulerState.onChange);
  } else if (rulerState.media.addListener) {
    rulerState.media.addListener(rulerState.onChange);
  }

  if (rulerState.media.matches) enableRuler();

  // first paint
  paintScroll();
})();
