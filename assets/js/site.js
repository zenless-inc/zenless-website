/* Zenless website — progressive enhancement only. The site is fully readable
 * without this file; it adds the theme switcher, mobile nav, scroll reveals
 * and the animated app previews. */
(() => {
  "use strict";

  const root = document.documentElement;
  const ICONS = "/assets/img/icons.svg?v=0.1.0";
  const THEMES = window.ZENLESS_THEMES || [["zenless", "Zenless"]];
  const KEY = window.ZENLESS_THEME_KEY || "zenless-theme";
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reducedMotion = () => motionQuery.matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const store = {
    get(k) {
      try {
        return window.localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set(k, v) {
      try {
        window.localStorage.setItem(k, v);
      } catch {
        /* storage unavailable: the choice just won't persist */
      }
    },
  };

  const icon = (name, cls = "icon") =>
    `<svg class="${cls}" aria-hidden="true"><use href="${ICONS}#${name}"></use></svg>`;

  // ---------------------------------------------------------------------------
  // Themes
  // ---------------------------------------------------------------------------
  const PALETTE_FIELDS = [
    ["bg", "Background"],
    ["surface", "Surface"],
    ["surface2", "Controls"],
    ["input", "Inputs"],
    ["stripe", "Row stripe"],
    ["border", "Border"],
    ["text", "Text"],
    ["dim", "Dim text"],
    ["accent", "Accent"],
    ["accent-fg", "Text on accent"],
    ["accent2", "Second accent"],
    ["success", "Success"],
    ["warning", "Warning"],
    ["danger", "Danger"],
    ["info", "Info"],
  ];

  const isTheme = (id) => THEMES.some(([t]) => t === id);
  const themeName = (id) => (THEMES.find(([t]) => t === id) || THEMES[0])[1];
  const currentTheme = () => root.getAttribute("data-theme") || "zenless";

  function syncThemeUI() {
    const id = currentTheme();
    $$("[data-set-theme]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setTheme === id)));
    $$("[data-theme-select]").forEach((s) => (s.value = id));
    $$("[data-theme-name]").forEach((el) => (el.textContent = themeName(id)));

    const cs = getComputedStyle(root);
    $$("[data-hex]").forEach((el) => (el.textContent = cs.getPropertyValue("--" + el.dataset.hex).trim()));
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", cs.getPropertyValue("--bg").trim() || "#0d0e12");
  }

  function setTheme(id, origin) {
    if (!isTheme(id)) id = "zenless";
    store.set(KEY, id);
    if (id === currentTheme()) return syncThemeUI();

    const commit = () => {
      root.setAttribute("data-theme", id);
      syncThemeUI();
    };

    // Circular reveal from the control that was used (View Transitions API).
    if (origin && document.startViewTransition && !reducedMotion()) {
      const r = origin.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const vt = document.startViewTransition(commit);
      vt.ready
        .then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)", pseudoElement: "::view-transition-new(root)" }
          );
        })
        .catch(() => {});
    } else {
      commit();
    }
  }

  function buildSwatches() {
    const host = $("[data-swatches]");
    if (!host) return;
    const frag = document.createDocumentFragment();
    for (const [id, name] of THEMES) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.dataset.theme = id; // scopes the palette to the swatch itself
      b.dataset.setTheme = id;
      b.setAttribute("aria-pressed", "false");
      b.innerHTML =
        '<span class="sw-preview" aria-hidden="true">' +
        '<span class="sw-top"><i></i><i></i><i></i></span>' +
        '<span class="sw-side"><i></i><i></i><i></i><i></i></span>' +
        '<span class="sw-rows"><span class="sw-row"><b></b><s></s></span><span class="sw-row"><b></b><s></s></span><span class="sw-row"><b></b><s></s></span></span>' +
        "</span>" +
        `<span class="sw-meta"><span class="sw-name">${name}</span>` +
        '<span class="sw-dots" aria-hidden="true"><i class="c-accent"></i><i class="c-accent2"></i><i class="c-success"></i></span></span>' +
        `<span class="sw-check" aria-hidden="true">${icon("check")}</span>`;
      frag.append(b);
    }
    host.prepend(frag);
  }

  function buildPalette() {
    const host = $("[data-palette]");
    if (!host) return;
    for (const [key, label] of PALETTE_FIELDS) {
      const row = document.createElement("div");
      row.className = "pal";
      const sw = document.createElement("i");
      sw.style.setProperty("--c", `var(--${key})`);
      const txt = document.createElement("span");
      txt.innerHTML = `<b>${label}</b><code data-hex="${key}"></code>`;
      row.append(sw, txt);
      host.append(row);
    }
  }

  function buildSelects() {
    $$("[data-theme-select]").forEach((sel) => {
      sel.textContent = "";
      for (const [id, name] of THEMES) sel.append(new Option(name, id));
      sel.addEventListener("change", () => setTheme(sel.value, sel));
      const wrap = sel.closest("[data-theme-picker]");
      if (wrap) wrap.hidden = false;
    });
  }

  function initThemes() {
    buildSwatches();
    buildPalette();
    buildSelects();
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-set-theme]");
      if (b) setTheme(b.dataset.setTheme, b);
    });
    // Keep several open tabs in sync.
    window.addEventListener("storage", (e) => {
      if (e.key === KEY && e.newValue && isTheme(e.newValue)) {
        root.setAttribute("data-theme", e.newValue);
        syncThemeUI();
      }
    });
    syncThemeUI();
  }

  // ---------------------------------------------------------------------------
  // Header: mobile menu + scrolled state
  // ---------------------------------------------------------------------------
  function initNav() {
    const header = $(".site-header");
    if (!header) return;
    const toggle = $(".nav-toggle", header);
    const menu = $(".nav-menu", header);

    const setOpen = (open) => {
      header.toggleAttribute("data-open", open);
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      }
    };

    toggle?.addEventListener("click", () => setOpen(!header.hasAttribute("data-open")));
    menu?.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && header.hasAttribute("data-open")) {
        setOpen(false);
        toggle?.focus();
      }
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => e.matches && setOpen(false));

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---------------------------------------------------------------------------
  // Scroll reveal + card spotlight
  // ---------------------------------------------------------------------------
  function initReveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window) || reducedMotion()) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
  }

  function initSpotlight() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    document.addEventListener(
      "pointermove",
      (e) => {
        const card = e.target.closest && e.target.closest(".card");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      },
      { passive: true }
    );
  }

  // ---------------------------------------------------------------------------
  // Tabs (code sample) + copy buttons
  // ---------------------------------------------------------------------------
  function initTabs() {
    $$("[role=tablist]").forEach((list) => {
      const tabs = $$("[role=tab]", list);
      const select = (tab, focus) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          const panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      };
      list.addEventListener("click", (e) => {
        const t = e.target.closest("[role=tab]");
        if (t) select(t);
      });
      list.addEventListener("keydown", (e) => {
        const i = tabs.indexOf(document.activeElement);
        if (i < 0) return;
        let n = null;
        if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") n = 0;
        if (e.key === "End") n = tabs.length - 1;
        if (n !== null) {
          e.preventDefault();
          select(tabs[n], true);
        }
      });
    });
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to the legacy path */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (ok) return true;
    } catch {
      /* ignore */
    }
    // Last resort: select the visible text so Ctrl+C works.
    const code = button.parentElement && button.parentElement.querySelector("code");
    if (code) {
      const range = document.createRange();
      range.selectNodeContents(code);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    return false;
  }

  function initCopy() {
    const live = $("[data-live]");
    document.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-copy]");
      if (!b) return;
      const text = b.dataset.copy;
      const ok = await copyText(text, b);
      const label = $(".copy-label", b);
      if (label) {
        const prev = label.dataset.prev || label.textContent;
        label.dataset.prev = prev;
        label.textContent = ok ? "Copied" : "Press Ctrl+C";
        b.classList.toggle("done", ok);
        clearTimeout(b._t);
        b._t = setTimeout(() => {
          label.textContent = prev;
          b.classList.remove("done");
        }, 1800);
      }
      if (live) live.textContent = ok ? `Copied ${text} to the clipboard` : `${text} is selected. Press Ctrl+C to copy it.`;
    });
  }

  // ---------------------------------------------------------------------------
  // Formatting helpers (binary units, like the apps)
  // ---------------------------------------------------------------------------
  const UNITS = ["B", "KB", "MB", "GB", "TB"];
  function bytes(n) {
    let i = 0;
    while (n >= 1024 && i < UNITS.length - 1) {
      n /= 1024;
      i++;
    }
    const d = i === 0 || n >= 100 ? 0 : n >= 10 ? 1 : 2;
    return `${n.toFixed(d)} ${UNITS[i]}`;
  }
  const speed = (n) => (n > 0 ? `${bytes(n)}/s` : "—");
  function eta(sec) {
    if (!isFinite(sec) || sec <= 0) return "—";
    if (sec < 60) return `${Math.ceil(sec)}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${String(Math.floor(sec % 60)).padStart(2, "0")}s`;
    return `${Math.floor(sec / 3600)}h ${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}m`;
  }
  const STATUS = {
    downloading: "Downloading",
    completed: "Completed",
    paused: "Paused",
    queued: "Queued",
    seeding: "Seeding",
  };
  const rand = (a, b) => a + Math.random() * (b - a);

  // ---------------------------------------------------------------------------
  // Animation loop shared by every live preview. Runs only while a preview is
  // on screen, the tab is visible and the user hasn't asked for reduced motion.
  // ---------------------------------------------------------------------------
  const sims = [];
  let running = false;
  let last = 0;
  let textClock = 0;

  function shouldRun() {
    return !reducedMotion() && !document.hidden && sims.some((s) => s.visible);
  }
  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.1, (t - last) / 1000);
    last = t;
    textClock += dt;
    const text = textClock > 0.33;
    if (text) textClock = 0;
    for (const s of sims) if (s.visible) s.tick(dt, text);
    requestAnimationFrame(frame);
  }
  function updateLoop() {
    const want = shouldRun();
    if (want && !running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    } else if (!want) {
      running = false;
    }
  }
  function registerSim(el, sim) {
    sim.visible = false;
    sims.push(sim);
    sim.tick(0, true); // paint one static frame immediately
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        sim.visible = entries[0].isIntersecting;
        updateLoop();
      }).observe(el);
    }
  }
  document.addEventListener("visibilitychange", updateLoop);
  motionQuery.addEventListener("change", updateLoop);

  // Rows with data-row: progress, speed, ETA and status.
  function makeRows(container) {
    return $$("[data-row]", container).map((el) => {
      const f = {};
      $$("[data-f]", el).forEach((n) => (f[n.dataset.f] = n));
      return {
        el,
        f,
        state: el.dataset.state,
        loop: el.dataset.state === "downloading",
        size: Number(el.dataset.size) || 1,
        p: Number(el.dataset.p) || 0,
        base: Number(el.dataset.speed) || 0,
        upBase: Number(el.dataset.up) || 0,
        ratio: Number(el.dataset.ratio) || 0,
        main: el.hasAttribute("data-main"),
        speed: 0,
        up: 0,
        noise: rand(-1, 1),
        hold: 0,
      };
    });
  }

  function stepRow(r, dt) {
    r.noise = Math.max(-1, Math.min(1, r.noise + (Math.random() - 0.5) * dt * 3));
    if (r.state === "downloading" && !r.main) {
      r.speed = r.base * (1 + 0.2 * r.noise);
      r.p += (r.speed * dt) / r.size;
      if (r.p >= 1) {
        r.p = 1;
        r.state = "completed";
        r.hold = 4;
      }
    } else if (r.state === "completed" && r.loop && !r.main) {
      r.speed = 0;
      r.hold -= dt;
      if (r.hold <= 0) {
        r.p = rand(0.02, 0.08);
        r.state = "downloading";
      }
    } else if (r.state === "seeding") {
      r.up = r.upBase * (1 + 0.35 * r.noise);
      r.ratio += (r.up * dt) / r.size;
    } else if (!r.main) {
      r.speed = 0;
    }
  }

  function paintRow(r, text) {
    r.el.style.setProperty("--p", r.p.toFixed(4));
    if (!text) return;
    if (r.el.dataset.state !== r.state) r.el.dataset.state = r.state;
    const { f } = r;
    if (f.pct) f.pct.textContent = `${Math.floor(r.p * 100)}%`;
    if (f.speed) f.speed.textContent = r.state === "downloading" ? speed(r.speed) : "—";
    if (f.eta) f.eta.textContent = r.state === "downloading" ? eta(((1 - r.p) * r.size) / r.speed) : "—";
    if (f.status) f.status.textContent = STATUS[r.state] || r.state;
    if (f.up) f.up.textContent = r.state === "seeding" ? `↑ ${speed(r.up)}` : `↓ ${speed(r.speed)}`;
    if (f.ratio) f.ratio.textContent = r.state === "seeding" ? `ratio ${r.ratio.toFixed(2)}` : `${bytes(r.p * r.size)} of ${bytes(r.size)}`;
  }

  // IDM-style segment map with dynamic segmentation: when a connection finishes
  // its part it takes over half of the largest remaining part.
  class SegmentMap {
    constructor(map, connEls, size) {
      this.map = map;
      this.connEls = connEls;
      this.size = size;
      this.n = connEls.length || 12;
      this.minSplit = 0.004;
    }
    reset(startAt) {
      this.map.textContent = "";
      this.segs = [];
      const total = 56 * 1024 * 1024; // bytes/s across all connections
      this.conns = Array.from({ length: this.n }, () => ({
        active: true,
        base: (total / this.n / this.size) * rand(0.55, 1.45),
        noise: rand(-1, 1),
        rate: 0,
      }));
      for (let i = 0; i < this.n; i++) this.add(i / this.n, (i + 1) / this.n, i);
      while (this.progress() < startAt) this.step(0.5);
    }
    add(start, end, conn) {
      const el = document.createElement("div");
      el.className = "seg live";
      const fill = document.createElement("i");
      el.append(fill);
      this.map.append(el);
      const seg = { start, end, pos: start, conn, live: true, el, fill };
      this.segs.push(seg);
      return seg;
    }
    reassign(conn) {
      let best = null;
      let rem = 0;
      for (const s of this.segs) {
        if (s.live && s.end - s.pos > rem) {
          rem = s.end - s.pos;
          best = s;
        }
      }
      if (best && rem > this.minSplit) {
        const mid = best.pos + rem / 2;
        const end = best.end;
        best.end = mid;
        this.add(mid, end, conn);
      } else {
        this.conns[conn].active = false;
      }
    }
    step(dt) {
      for (const c of this.conns) {
        c.noise = Math.max(-1, Math.min(1, c.noise + (Math.random() - 0.5) * dt * 4));
        c.rate = c.active ? c.base * (1 + 0.3 * c.noise) : 0;
      }
      for (const s of this.segs) {
        if (!s.live) continue;
        s.pos = Math.min(s.end, s.pos + this.conns[s.conn].rate * dt);
        if (s.pos >= s.end) {
          s.live = false;
          s.el.classList.remove("live");
          this.reassign(s.conn);
        }
      }
    }
    progress() {
      let p = 0;
      for (const s of this.segs) p += s.pos - s.start;
      return Math.min(1, p);
    }
    bps() {
      let r = 0;
      for (const c of this.conns) r += c.rate;
      return r * this.size;
    }
    activeConns() {
      return this.conns.filter((c) => c.active).length;
    }
    paint(text) {
      for (const s of this.segs) {
        const w = s.end - s.start;
        s.el.style.left = `${s.start * 100}%`;
        s.el.style.width = `${w * 100}%`;
        s.fill.style.width = `${w > 0 ? ((s.pos - s.start) / w) * 100 : 100}%`;
      }
      if (!text) return;
      this.connEls.forEach((el, i) => {
        const c = this.conns[i];
        el.classList.toggle("off", !c.active);
        const b = el.querySelector("b");
        if (b) b.textContent = c.active ? speed(c.rate * this.size).replace("/s", "") : "done";
      });
    }
  }

  function initDownloadManagerMock() {
    const dm = $("[data-dm]");
    if (!dm) return;
    const rows = makeRows(dm);
    const main = rows.find((r) => r.main);
    const map = $("[data-segmap]", dm);
    const seg = map && main ? new SegmentMap(map, $$(".dm-conn", dm), main.size) : null;
    if (seg) seg.reset(main.p);

    const d = {};
    $$("[data-d]", dm).forEach((n) => (d[n.dataset.d] = n));
    const spark = $("[data-spark]", dm);
    const history = [];
    let sparkClock = 1;

    const sim = {
      tick(dt, text) {
        if (seg) {
          if (main.state === "downloading") {
            seg.step(dt);
            main.p = seg.progress();
            main.speed = seg.bps();
            if (seg.activeConns() === 0 || main.p >= 0.99999) {
              main.p = 1;
              main.state = "completed";
              main.hold = 3.5;
            }
          } else if (main.state === "completed") {
            main.hold -= dt;
            main.speed = 0;
            if (main.hold <= 0) {
              seg.reset(0.015);
              main.state = "downloading";
              main.p = seg.progress();
            }
          }
          seg.paint(text);
        }
        for (const r of rows) {
          stepRow(r, dt);
          paintRow(r, text);
        }
        if (!text) return;

        const total = rows.reduce((a, r) => a + (r.state === "downloading" ? r.speed : 0), 0);
        const active = rows.filter((r) => r.state === "downloading").length;
        const queued = rows.filter((r) => r.state === "queued").length;
        if (d.total) d.total.textContent = speed(total);
        if (d.active) d.active.textContent = `${active} active · ${queued} queued`;
        if (main && d.done) d.done.textContent = `${bytes(main.p * main.size)} of ${bytes(main.size)}`;
        if (seg && d.conns) d.conns.textContent = `${seg.activeConns()} / ${seg.n} connections`;
        if (seg && d.parts) d.parts.textContent = `${seg.segs.length} segments`;
        if (main && d.eta) d.eta.textContent = main.state === "downloading" ? `${eta(((1 - main.p) * main.size) / main.speed)} left` : "Complete";

        sparkClock += 0.33;
        if (spark && (sparkClock >= 0.66 || history.length === 0)) {
          sparkClock = 0;
          history.push(total);
          if (history.length > 30) history.shift();
          const max = Math.max(...history, 1) * 1.15;
          const span = Math.max(1, history.length - 1);
          const pts = history.map((v, i) => `${((i / span) * 90).toFixed(1)},${(18 - (v / max) * 16).toFixed(1)}`);
          $("polyline", spark).setAttribute("points", pts.join(" "));
          $("polygon", spark).setAttribute("points", `0,18 ${pts.join(" ")} 90,18`);
        }
      },
    };
    // Warm up the sparkline so the first paint isn't flat.
    for (let i = 0; i < 12; i++) {
      rows.forEach((r) => stepRow(r, 0.66));
      sim.tick(0, true);
    }
    registerSim(dm, sim);
  }

  function initTorrentMock() {
    $$("[data-tm]").forEach((tm) => {
      const rows = makeRows(tm);
      const first = rows[0];
      const cells = $$(".tm-pieces i", tm);
      const order = cells.map((_, i) => i).sort(() => Math.random() - 0.5);
      const d = {};
      $$("[data-d]", tm).forEach((n) => (d[n.dataset.d] = n));
      registerSim(tm, {
        tick(dt, text) {
          for (const r of rows) {
            stepRow(r, dt);
            paintRow(r, text);
          }
          if (!text) return;
          if (first) {
            const have = Math.floor(first.p * cells.length);
            order.forEach((ci, k) => cells[ci].classList.toggle("have", k < have));
          }
          const down = rows.reduce((a, r) => a + (r.state === "downloading" ? r.speed : 0), 0);
          const up = rows.reduce((a, r) => a + (r.state === "seeding" ? r.up : 0), 0) + down * 0.12;
          if (d.down) d.down.textContent = `↓ ${speed(down)}`;
          if (d.up) d.up.textContent = `↑ ${speed(up)}`;
        },
      });
    });
  }

  // Piece map on the Torrent product card.
  function initPieces() {
    const host = $("[data-pieces]");
    if (!host) return;
    const N = 24 * 6;
    const cells = [];
    for (let i = 0; i < N; i++) {
      const c = document.createElement("i");
      const r = Math.random();
      if (r < 0.52) c.className = "have";
      else if (r < 0.62) c.className = "part";
      host.append(c);
      cells.push(c);
    }
    registerSim(host, {
      clock: 0,
      tick(dt) {
        this.clock += dt;
        if (this.clock < 0.45) return;
        this.clock = 0;
        const missing = cells.filter((c) => !c.classList.contains("have"));
        if (missing.length === 0) {
          cells.forEach((c) => (c.className = Math.random() < 0.15 ? "have" : ""));
          return;
        }
        const pick = missing[Math.floor(Math.random() * missing.length)];
        pick.className = pick.classList.contains("part") ? "have" : "part";
      },
    });
  }

  // ---------------------------------------------------------------------------
  initThemes();
  initNav();
  initReveal();
  initSpotlight();
  initTabs();
  initCopy();
  initDownloadManagerMock();
  initTorrentMock();
  initPieces();
  updateLoop();
})();
