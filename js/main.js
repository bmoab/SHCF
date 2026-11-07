/* ==========================================================================
   ThrHIVE · interactions
   No frameworks, no build step. Reads event details from js/event.config.js
   ========================================================================== */
(() => {
  "use strict";

  const C = window.THRHIVE || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  document.documentElement.classList.remove("no-js");
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------------
     Nav state + scroll progress
     ------------------------------------------------------------------------ */
  const nav = $("#nav");
  const bar = $(".progress span");
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------------
     Hero honeycomb: a hex grid that lights up around the cursor and
     pulses on its own like a living hive.
     ------------------------------------------------------------------------ */
  const canvas = $("#comb");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    let W = 0, H = 0, dpr = 1, R = 34, cells = [], running = false, raf = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = W < 640 ? 26 : 36;
      const w = Math.sqrt(3) * R, h = 1.5 * R;
      cells = [];
      for (let row = -1, y = 0; y < H + R * 2; row++, y = row * h) {
        for (let col = -1; col * w < W + w; col++) {
          const x = col * w + (row % 2 ? w / 2 : 0);
          cells.push({ x, y, v: 0, t: Math.random() * 1000 });
        }
      }
    };

    const hex = (x, y, r) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
    };

    let last = performance.now();
    const draw = (now) => {
      const dt = Math.min(64, now - last); last = now;
      ctx.clearRect(0, 0, W, H);
      // ambient sparks
      if (Math.random() < 0.18) {
        const c = cells[(Math.random() * cells.length) | 0];
        if (c) c.v = Math.max(c.v, 0.55 + Math.random() * 0.45);
      }
      for (const c of cells) {
        if (mouse.active) {
          const d = Math.hypot(c.x - mouse.x, c.y - mouse.y);
          const target = clamp(1 - d / (R * 4.2), 0, 1);
          if (target > c.v) c.v += (target - c.v) * 0.35;
        }
        c.v *= Math.pow(0.955, dt / 16);
        // fade the grid out toward the left/bottom where the text lives
        const fade = clamp(c.x / W + 0.15, 0.12, 1) * clamp(1.25 - c.y / H, 0.25, 1);
        hex(c.x, c.y, R - 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(232,245,42,${(0.05 + c.v * 0.55) * fade})`;
        ctx.stroke();
        if (c.v > 0.04) {
          ctx.fillStyle = `rgba(232,245,42,${c.v * 0.16 * fade})`;
          ctx.fill();
        }
      }
      if (running) raf = requestAnimationFrame(draw);
    };

    const start = () => { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(draw); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    build();
    if (reduceMotion) {
      // static, quiet grid
      for (const c of cells) c.v = Math.random() < 0.06 ? 0.6 : 0;
      running = false; draw(performance.now());
    } else {
      new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(hero);
      hero.addEventListener("pointermove", (e) => {
        const r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
      });
      hero.addEventListener("pointerleave", () => { mouse.active = false; });
    }
    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { build(); if (reduceMotion) draw(performance.now()); }, 150);
    });
  }

  /* ------------------------------------------------------------------------
     Countdown: scrambles until a date is set in the config, then counts down.
     ------------------------------------------------------------------------ */
  const cdWrap = $("#countdown");
  const cdLabel = $("#countdown-label");
  const units = { d: $('[data-unit="d"]'), h: $('[data-unit="h"]'), m: $('[data-unit="m"]'), s: $('[data-unit="s"]') };
  const target = C.date ? new Date(C.date) : null;
  const pad = (n) => String(n).padStart(2, "0");

  if (target && !isNaN(target)) {
    cdWrap.dataset.state = "live";
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        cdLabel.textContent = "ThrHIVE is LIVE. Let's go!";
        Object.values(units).forEach((u) => (u.textContent = "00"));
        return;
      }
      cdLabel.textContent = C.dateLabel ? `T-minus · ${C.dateLabel}` : "T-minus";
      units.d.textContent = pad(Math.floor(diff / 864e5));
      units.h.textContent = pad(Math.floor((diff / 36e5) % 24));
      units.m.textContent = pad(Math.floor((diff / 6e4) % 60));
      units.s.textContent = pad(Math.floor((diff / 1e3) % 60));
      setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
  } else {
    cdWrap.dataset.state = "scramble";
    cdLabel.textContent = "Date dropping soon";
    const glyphs = "0123456789";
    const scramble = () => {
      Object.values(units).forEach((u) => {
        u.textContent = glyphs[(Math.random() * 10) | 0] + glyphs[(Math.random() * 10) | 0];
      });
    };
    scramble();
    if (!reduceMotion) setInterval(scramble, 90);
    else Object.values(units).forEach((u) => (u.textContent = "??"));
  }

  /* ------------------------------------------------------------------------
     Intel cards (rendered from config)
     ------------------------------------------------------------------------ */
  const fmtAnnounced = () => {
    const d = new Date(`${C.announcedOn || "2026-11-05"}T12:00:00`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const whenValue = () => {
    if (!target || isNaN(target)) return null;
    return {
      value: C.dateLabel || target.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      detail: target.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Denver" }) + " MT · " + target.getFullYear(),
    };
  };
  const cards = [
    { label: "Hosted by", data: { value: "Salty Hive CrossFit", detail: "Millcreek · Salt Lake City, Utah" } },
    { label: "Announced", data: { value: fmtAnnounced(), detail: "The word is officially out. 🐝" } },
    { label: "When", data: whenValue(), teaser: "Date drops soon. Stay ready." },
    { label: "Where", data: C.where, teaser: "Location reveal incoming." },
    { label: "The Format", data: C.format, teaser: "What you'll be doing. Classified." },
    { label: "Who's In", data: C.who, teaser: "Divisions dropping soon." },
    { label: "The Cost", data: C.cost, teaser: "Price drops with the details." },
    { label: "The Why", data: C.why, teaser: "Hear it in the announcement." },
  ];
  const lockSvg = '<svg class="card__lock" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z"/></svg>';
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const grid = $("#intel-grid");
  if (grid) {
    grid.innerHTML = cards.map((c, i) => {
      const n = String(i + 1).padStart(2, "0");
      if (c.data && c.data.value) {
        return `<article class="card card--open reveal" style="--d:${(i % 4) * 0.08}s">
          <p class="card__label"><span>${esc(c.label)}</span><span class="card__idx">${n}</span></p>
          <h3 class="card__value">${esc(c.data.value)}</h3>
          ${c.data.detail ? `<p class="card__detail">${esc(c.data.detail)}</p>` : ""}
        </article>`;
      }
      return `<article class="card card--locked reveal" style="--d:${(i % 4) * 0.08}s" aria-label="${esc(c.label)}: not announced yet">
        <p class="card__label"><span>${esc(c.label)}</span>${lockSvg}</p>
        <div class="card__value" aria-hidden="true"><span class="redact"></span><span class="redact"></span></div>
        <p class="card__detail">${esc(c.teaser)}</p>
        <span class="stamp" aria-hidden="true">Classified</span>
      </article>`;
    }).join("");
  }

  /* ------------------------------------------------------------------------
     Calls to action from config: register link + calendar invite
     ------------------------------------------------------------------------ */
  if (C.registerUrl) {
    const reg = $("#cta-register");
    reg.href = C.registerUrl; reg.hidden = false;
    $$(".js-primary-cta").forEach((a) => {
      a.href = C.registerUrl; a.target = "_blank"; a.rel = "noopener";
      if (!a.closest(".hero__ctas") && !a.closest(".nav")) return;
      a.firstChild.textContent = "Register ";
    });
  }
  if (target && !isNaN(target)) {
    const cal = $("#cta-cal");
    cal.hidden = false;
    cal.addEventListener("click", () => {
      const end = new Date(target.getTime() + (C.durationHours || 6) * 36e5);
      const f = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const loc = C.where && C.where.value ? `${C.where.value}${C.where.detail ? ", " + C.where.detail : ""}` : `Salty Hive CrossFit, ${C.address}`;
      const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Salty Hive CrossFit//ThrHIVE//EN",
        "BEGIN:VEVENT",
        `UID:thrhive-${f(target)}@saltyhivecrossfit.com`,
        `DTSTAMP:${f(new Date())}`,
        `DTSTART:${f(target)}`, `DTEND:${f(end)}`,
        "SUMMARY:ThrHIVE @ Salty Hive CrossFit 🐝",
        `LOCATION:${loc.replace(/,/g, "\\,")}`,
        `DESCRIPTION:Bring your crew. ${C.registerUrl ? "Register: " + C.registerUrl : ""}`,
        "END:VEVENT", "END:VCALENDAR",
      ].join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      a.download = "thrhive.ics";
      document.body.appendChild(a); a.click(); a.remove();
    });
  }

  /* ------------------------------------------------------------------------
     Reveal on scroll + heading scramble + count-up
     ------------------------------------------------------------------------ */
  const scrambleText = (el) => {
    if (reduceMotion || el.dataset.done) return;
    el.dataset.done = "1";
    const final = el.textContent;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*!?";
    let frame = 0;
    const total = 22;
    const step = () => {
      frame++;
      const p = frame / total;
      el.textContent = final.split("").map((ch, i) => {
        if (ch === " " || i / final.length < p) return ch;
        return chars[(Math.random() * chars.length) | 0];
      }).join("");
      if (frame < total) requestAnimationFrame(() => setTimeout(step, 28));
      else el.textContent = final;
    };
    step();
  };

  const countUp = (el) => {
    const end = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = end.toLocaleString(); return; }
    const dur = 1600, t0 = performance.now();
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("is-in");
      if (el.hasAttribute("data-scramble")) scrambleText(el);
      const n = el.querySelector("[data-count]");
      if (n) countUp(n);
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ------------------------------------------------------------------------
     Lite YouTube embed (loads the player only when tapped)
     ------------------------------------------------------------------------ */
  const yt = $("#yt");
  if (yt) {
    yt.addEventListener("click", () => {
      const id = C.youtubeId || "nTL6EOq-iPo";
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
      iframe.title = "SHCF ThrHIVE Announcement";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      yt.replaceChildren(iframe);
      yt.style.cursor = "default";
    }, { once: true });
  }

  /* ------------------------------------------------------------------------
     Reel: pinned horizontal scroll on wide screens, swipe on phones
     ------------------------------------------------------------------------ */
  const reel = $("#reel");
  const track = $("#reel-track");
  if (reel && track) {
    const mq = window.matchMedia("(min-width: 900px)");
    let dist = 0;
    const layout = () => {
      const pinned = mq.matches && !reduceMotion;
      reel.classList.toggle("is-pinned", pinned);
      if (!pinned) { reel.style.height = ""; track.style.transform = ""; return; }
      const viewport = track.parentElement;
      const padL = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
      dist = Math.max(0, track.scrollWidth - window.innerWidth + padL * 2);
      reel.style.height = `${window.innerHeight + dist}px`;
      move();
    };
    const move = () => {
      if (!reel.classList.contains("is-pinned")) return;
      const r = reel.getBoundingClientRect();
      const p = clamp(-r.top / (reel.offsetHeight - window.innerHeight || 1), 0, 1);
      track.style.transform = `translate3d(${-p * dist}px,0,0)`;
    };
    window.addEventListener("scroll", move, { passive: true });
    window.addEventListener("resize", layout);
    mq.addEventListener ? mq.addEventListener("change", layout) : mq.addListener(layout);
    // images affect scrollWidth; re-measure as they load
    $$("img", track).forEach((img) => img.complete || img.addEventListener("load", layout, { once: true }));
    layout();
    window.addEventListener("load", layout);
  }

  /* ------------------------------------------------------------------------
     Statement parallax
     ------------------------------------------------------------------------ */
  const stmtImg = $(".statement__bg img");
  if (stmtImg && !reduceMotion) {
    const sec = stmtImg.closest(".statement");
    window.addEventListener("scroll", () => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      stmtImg.style.setProperty("--parallax", `${(-15 + p * 18).toFixed(2)}%`);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     Testimonials rotator
     ------------------------------------------------------------------------ */
  const quotes = $$("#quotes .quote");
  const dots = $("#quote-dots");
  if (quotes.length && dots) {
    let qi = 0, qt;
    quotes.forEach((q, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `Quote ${i + 1} of ${quotes.length}`);
      b.addEventListener("click", () => { show(i); restart(); });
      dots.appendChild(b);
    });
    const show = (i) => {
      qi = i;
      quotes.forEach((q, k) => { q.classList.toggle("is-active", k === i); q.setAttribute("aria-hidden", String(k !== i)); });
      $$("button", dots).forEach((b, k) => b.setAttribute("aria-selected", String(k === i)));
    };
    const restart = () => { clearInterval(qt); if (!reduceMotion) qt = setInterval(() => show((qi + 1) % quotes.length), 6500); };
    show(0); restart();
  }

  /* ------------------------------------------------------------------------
     Magnetic buttons (desktop only)
     ------------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------------------
     Hype meter + bee/honeycomb confetti
     ------------------------------------------------------------------------ */
  const confetti = $("#confetti");
  const burst = (x, y, n = 18) => {
    if (reduceMotion || !confetti) return;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("i");
      const isBee = Math.random() < 0.35;
      if (isBee) { el.textContent = "🐝"; el.style.fontSize = `${16 + Math.random() * 14}px`; }
      else el.className = "hex";
      confetti.appendChild(el);
      const ang = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      let vx = Math.cos(ang) * speed, vy = Math.sin(ang) * speed - 7;
      let px = x, py = y, rot = Math.random() * 360, vr = (Math.random() - 0.5) * 20, life = 0;
      const step = () => {
        life++;
        vy += 0.38; vx *= 0.985;
        px += vx; py += vy; rot += vr;
        el.style.transform = `translate(${px}px, ${py}px) rotate(${rot}deg)`;
        el.style.opacity = String(clamp(1 - life / 80, 0, 1));
        if (life < 80 && py < window.innerHeight + 40) requestAnimationFrame(step);
        else el.remove();
      };
      requestAnimationFrame(step);
    }
  };

  const hypeBtn = $("#hype-btn");
  if (hypeBtn) {
    const levels = [
      [0, "Cold start"], [3, "Warming up"], [10, "Getting salty"], [20, "Swarming 🐝"],
      [35, "Hive mind"], [50, "FULL SEND"],
    ];
    const fill = $("#hype-fill"), lvl = $("#hype-level"), cnt = $("#hype-count");
    let taps = Number(store.get("thrhive-hype") || 0) || 0;
    const render = () => {
      cnt.textContent = taps.toLocaleString();
      fill.style.width = `${clamp(taps / 50, 0, 1) * 100}%`;
      let label = levels[0][1];
      for (const [min, l] of levels) if (taps >= min) label = l;
      if (lvl.textContent !== label) lvl.textContent = label;
    };
    render();
    hypeBtn.addEventListener("click", (e) => {
      taps++;
      store.set("thrhive-hype", String(taps));
      render();
      hypeBtn.classList.remove("is-bump"); void hypeBtn.offsetWidth; hypeBtn.classList.add("is-bump");
      const r = hypeBtn.getBoundingClientRect();
      const x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2;
      burst(x, y, taps % 10 === 0 ? 48 : 16);
    });
  }

  // A little celebration for every "I'm in" click too
  $$(".js-primary-cta").forEach((a) => a.addEventListener("click", (e) => {
    const r = a.getBoundingClientRect();
    burst(e.clientX || r.left + r.width / 2, e.clientY || r.top, 22);
  }));
})();
