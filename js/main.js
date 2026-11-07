/* ==========================================================================
   ThrHIVE · interactions
   No frameworks, no build step. Reads details from js/event.config.js
   ========================================================================== */
(() => {
  "use strict";

  const C = window.THRHIVE || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const money = (n) => "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  document.documentElement.classList.remove("no-js");
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------------
     Toast
     ------------------------------------------------------------------------ */
  const toastEl = $("#toast");
  let toastT;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("is-on"), 2600);
  };

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
          cells.push({ x: col * w + (row % 2 ? w / 2 : 0), y, v: 0 });
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
      if (running && Math.random() < 0.18) {
        const c = cells[(Math.random() * cells.length) | 0];
        if (c) c.v = Math.max(c.v, 0.55 + Math.random() * 0.45);
      }
      for (const c of cells) {
        if (mouse.active) {
          const d = Math.hypot(c.x - mouse.x, c.y - mouse.y);
          const t = clamp(1 - d / (R * 4.2), 0, 1);
          if (t > c.v) c.v += (t - c.v) * 0.35;
        }
        if (running) c.v *= Math.pow(0.955, dt / 16);
        // fade the grid toward the left/bottom where the text lives
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
    const drawStatic = () => { for (const c of cells) c.v = Math.random() < 0.06 ? 0.6 : 0; draw(performance.now()); };

    build();
    if (reduceMotion) {
      drawStatic();
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
      rt = setTimeout(() => { build(); if (reduceMotion) drawStatic(); }, 150);
    });
  }

  /* ------------------------------------------------------------------------
     Countdown to the Thrive Throwdown
     ------------------------------------------------------------------------ */
  const cdWrap = $("#countdown");
  const cdLabel = $("#countdown-label");
  const units = { d: $('[data-unit="d"]'), h: $('[data-unit="h"]'), m: $('[data-unit="m"]'), s: $('[data-unit="s"]') };
  const target = C.countdownTo ? new Date(C.countdownTo) : null;
  const pad = (n) => String(n).padStart(2, "0");

  if (target && !isNaN(target)) {
    cdWrap.dataset.state = "live";
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        cdLabel.textContent = "Throwdown day is here. Let's go! 🐝";
        Object.values(units).forEach((u) => (u.textContent = "00"));
        return;
      }
      cdLabel.textContent = C.countdownLabel || "T-minus";
      units.d.textContent = pad(Math.floor(diff / 864e5));
      units.h.textContent = pad(Math.floor((diff / 36e5) % 24));
      units.m.textContent = pad(Math.floor((diff / 6e4) % 60));
      units.s.textContent = pad(Math.floor((diff / 1e3) % 60));
      setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
  } else {
    // No date yet: scramble behind a "classified" stamp
    cdWrap.dataset.state = "scramble";
    cdLabel.textContent = "Date dropping soon";
    const scramble = () => Object.values(units).forEach((u) => {
      u.textContent = String((Math.random() * 100) | 0).padStart(2, "0");
    });
    scramble();
    if (!reduceMotion) setInterval(scramble, 90);
  }

  /* ------------------------------------------------------------------------
     Throwdown intel cards (rendered from config)
     ------------------------------------------------------------------------ */
  const lockSvg = '<svg class="card__lock" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z"/></svg>';
  const grid = $("#intel-grid");
  if (grid && Array.isArray(C.intel)) {
    grid.innerHTML = C.intel.map((c, i) => {
      const n = String(i + 1).padStart(2, "0");
      const d = `style="--d:${(i % 4) * 0.08}s"`;
      if (c.value) {
        return `<article class="card card--open reveal" ${d}>
          <p class="card__label"><span>${esc(c.label)}</span><span class="card__idx">${n}</span></p>
          <h4 class="card__value">${esc(c.value)}</h4>
          ${c.detail ? `<p class="card__detail">${esc(c.detail)}</p>` : ""}
        </article>`;
      }
      return `<article class="card card--locked reveal" ${d} aria-label="${esc(c.label)}: not announced yet">
        <p class="card__label"><span>${esc(c.label)}</span>${lockSvg}</p>
        <div class="card__value" aria-hidden="true"><span class="redact"></span><span class="redact"></span></div>
        <p class="card__detail">${esc(c.teaser || "Dropping soon.")}</p>
        <span class="stamp" aria-hidden="true">Classified</span>
      </article>`;
    }).join("");
  }

  /* ------------------------------------------------------------------------
     Register / donate links from config
     ------------------------------------------------------------------------ */
  const external = (a, url) => { a.href = url; a.target = "_blank"; a.rel = "noopener"; };
  if (C.registerUrl) {
    const reg = $("#cta-register");
    external(reg, C.registerUrl); reg.hidden = false;
    $$(".js-primary-cta").forEach((a) => {
      external(a, C.registerUrl);
      if (a.firstChild && a.firstChild.nodeType === 3) a.firstChild.textContent = "Register ";
    });
  }
  if (C.donateUrl) {
    const don = $("#cta-donate");
    external(don, C.donateUrl); don.hidden = false;
    const askBtn = $("#cta-donate-text");
    if (askBtn) askBtn.hidden = true;
    $$(".js-donate-link").forEach((a) => external(a, C.donateUrl));
  }

  /* ------------------------------------------------------------------------
     Calendar invite (.ics) for the Liftoff + Throwdown
     ------------------------------------------------------------------------ */
  const calBtn = $("#cta-cal");
  if (calBtn) {
    const events = Array.isArray(C.calendar) ? C.calendar : [];
    if (!events.length) calBtn.hidden = true;
    calBtn.addEventListener("click", () => {
      const utc = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const day = (s) => s.replace(/-/g, "");
      const nextDay = (s) => { const d = new Date(`${s}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ""); };
      const icsEsc = (s) => String(s).replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
      const loc = icsEsc(`Salty Hive CrossFit, ${C.address || "4050 S Howick St, Salt Lake City, UT 84107"}`);
      const desc = icsEsc(`ThrHIVE: free CrossFit for local recovery programs. Bring your crew!${C.registerUrl ? " Register: " + C.registerUrl : ""}`);
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Salty Hive CrossFit//ThrHIVE//EN", "CALSCALE:GREGORIAN"];
      events.forEach((ev, i) => {
        lines.push("BEGIN:VEVENT", `UID:thrhive-${i}-${ev.date || ev.start}@saltyhivecrossfit.com`, `DTSTAMP:${utc(new Date())}`);
        if (ev.start) {
          const s = new Date(ev.start);
          const e = ev.end ? new Date(ev.end) : new Date(s.getTime() + 4 * 36e5);
          lines.push(`DTSTART:${utc(s)}`, `DTEND:${utc(e)}`);
        } else {
          lines.push(`DTSTART;VALUE=DATE:${day(ev.date)}`, `DTEND;VALUE=DATE:${nextDay(ev.date)}`);
        }
        lines.push(`SUMMARY:${icsEsc(ev.title)}`, `LOCATION:${loc}`, `DESCRIPTION:${desc}`, "END:VEVENT");
      });
      lines.push("END:VCALENDAR");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
      a.download = "thrhive-weekend.ics";
      document.body.appendChild(a); a.click(); a.remove();
      toast("Saved. See you Dec 11–12 🐝");
    });
  }

  /* ------------------------------------------------------------------------
     Fundraising honeycomb meter
     ------------------------------------------------------------------------ */
  const meter = $("#meter");
  if (meter) {
    const comb = $("#meter-comb");
    const CELLS = 24;
    comb.innerHTML = Array.from({ length: CELLS }, (_, i) => `<i style="--i:${i}"></i>`).join("");
    const goal = Number(C.goal) || 0;
    if (goal > 0) {
      const raised = Math.max(0, Number(C.raised) || 0);
      const pct = clamp(raised / goal, 0, 1);
      meter.dataset.state = "live";
      $("#meter-status").textContent = raised ? `${money(raised)} raised` : `Goal: ${money(goal)}`;
      $("#meter-sub").textContent = raised
        ? `${Math.round(pct * 100)}% of our ${money(goal)} goal. Let's fill the Hive.`
        : "Every dollar fills a cell. Let's fill the Hive.";
      const fill = () => $$("i", comb).forEach((c, i) => c.classList.toggle("is-on", i < Math.round(pct * CELLS)));
      new IntersectionObserver(([e], o) => { if (e.isIntersecting) { fill(); o.disconnect(); } }, { threshold: 0.4 }).observe(meter);
    }
  }

  /* ------------------------------------------------------------------------
     Share this page
     ------------------------------------------------------------------------ */
  const shareBtn = $("#share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const data = {
        title: "ThrHIVE · Thrive Throwdown Dec 12",
        text: "Salty Hive just launched ThrHIVE: free CrossFit for local recovery programs. Liftoff Dec 11, Thrive Throwdown Dec 12. 🐝",
        url: window.location.href.split("#")[0],
      };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(data.url);
        toast("Link copied. Send it! 🐝");
      } catch (e) {
        if (e && e.name === "AbortError") return;
        toast(data.url);
      }
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
      el.textContent = final.split("").map((ch, i) => (ch === " " || i / final.length < p) ? ch : chars[(Math.random() * chars.length) | 0]).join("");
      if (frame < total) setTimeout(() => requestAnimationFrame(step), 28);
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
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))).toLocaleString();
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
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${C.youtubeId || "nTL6EOq-iPo"}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
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
    const move = () => {
      if (!reel.classList.contains("is-pinned")) return;
      const r = reel.getBoundingClientRect();
      const p = clamp(-r.top / (reel.offsetHeight - window.innerHeight || 1), 0, 1);
      track.style.transform = `translate3d(${-p * dist}px,0,0)`;
    };
    const layout = () => {
      const pinned = mq.matches && !reduceMotion;
      reel.classList.toggle("is-pinned", pinned);
      if (!pinned) { reel.style.height = ""; track.style.transform = ""; return; }
      const padL = parseFloat(getComputedStyle(track.parentElement).paddingLeft) || 0;
      dist = Math.max(0, track.scrollWidth - window.innerWidth + padL * 2);
      reel.style.height = `${window.innerHeight + dist}px`;
      move();
    };
    window.addEventListener("scroll", move, { passive: true });
    window.addEventListener("resize", layout);
    if (mq.addEventListener) mq.addEventListener("change", layout); else mq.addListener(layout);
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
    const show = (i) => {
      qi = i;
      quotes.forEach((q, k) => { q.classList.toggle("is-active", k === i); q.setAttribute("aria-hidden", String(k !== i)); });
      $$("button", dots).forEach((b, k) => b.setAttribute("aria-selected", String(k === i)));
    };
    const restart = () => { clearInterval(qt); if (!reduceMotion) qt = setInterval(() => show((qi + 1) % quotes.length), 6500); };
    quotes.forEach((q, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `Quote ${i + 1} of ${quotes.length}`);
      b.addEventListener("click", () => { show(i); restart(); });
      dots.appendChild(b);
    });
    show(0); restart();
  }

  /* ------------------------------------------------------------------------
     Magnetic buttons (desktop only)
     ------------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
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
      if (Math.random() < 0.35) { el.textContent = "🐝"; el.style.fontSize = `${16 + Math.random() * 14}px`; }
      else el.className = "hex";
      confetti.appendChild(el);
      const ang = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      let vx = Math.cos(ang) * speed, vy = Math.sin(ang) * speed - 7;
      let px = x, py = y, rot = Math.random() * 360, life = 0;
      const vr = (Math.random() - 0.5) * 20;
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
    const levels = [[0, "Cold start"], [3, "Warming up"], [10, "Getting salty"], [20, "Swarming 🐝"], [35, "Hive mind"], [50, "FULL SEND"]];
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
      burst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, taps % 10 === 0 ? 48 : 16);
    });
  }

  // A little celebration for every "I'm in" click too
  $$(".js-primary-cta").forEach((a) => a.addEventListener("click", (e) => {
    const r = a.getBoundingClientRect();
    burst(e.clientX || r.left + r.width / 2, e.clientY || r.top, 22);
  }));
})();
