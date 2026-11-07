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
        cdLabel.textContent = "Throwdown day is here. Let's go!";
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
    // No date yet: scramble behind a "coming soon" stamp
    cdWrap.dataset.state = "scramble";
    cdLabel.textContent = "Date dropping soon";
    const scramble = () => Object.values(units).forEach((u) => {
      u.textContent = String((Math.random() * 100) | 0).padStart(2, "0");
    });
    scramble();
    if (!reduceMotion) setInterval(scramble, 90);
  }

  /* ------------------------------------------------------------------------
     Throwdown game plan cards (rendered from config)
     ------------------------------------------------------------------------ */
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
      return `<article class="card card--soon reveal" ${d}>
        <p class="card__label"><span>${esc(c.label)}</span><span class="card__pulse" aria-hidden="true"></span></p>
        <h4 class="card__value">Coming soon</h4>
        <p class="card__detail">${esc(c.teaser || "Announced soon.")}</p>
      </article>`;
    }).join("");
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
      toast("Saved. See you Dec 11–12");
    });
  }

  /* ------------------------------------------------------------------------
     Program tracker (honeycomb meter): 20 cells, each 1/20 of the goal
     ------------------------------------------------------------------------ */
  const meter = $("#meter");
  if (meter) {
    const prog = (Array.isArray(C.programs) && C.programs[0]) || { name: "Program 01", goal: 4000 };
    const goal = Number(prog.goal) || 4000;
    const CELLS = 20;
    const comb = $("#meter-comb");
    comb.innerHTML = Array.from({ length: CELLS }, (_, i) => `<i style="--i:${i}"></i>`).join("");
    $("#meter-title").textContent = prog.name || "Program 01";
    $("#meter-phase").textContent = prog.status || "Funding now";
    const raised = Math.max(0, Number(prog.raised) || 0);
    $("#meter-status").textContent = raised ? `${money(raised)} of ${money(goal)}` : `${money(goal)} goal`;
    $("#meter-sub").textContent = raised
      ? `${Math.min(100, Math.round((raised / goal) * 100))}% funded. Every cell is ${money(goal / CELLS)}.`
      : `Every cell is ${money(goal / CELLS)}. Let's fill the Hive.`;
    if (raised) {
      meter.dataset.state = "live";
      const on = Math.min(CELLS, Math.round((raised / goal) * CELLS));
      new IntersectionObserver(([e], o) => {
        if (!e.isIntersecting) return;
        $$("i", comb).forEach((c, i) => c.classList.toggle("is-on", i < on));
        o.disconnect();
      }, { threshold: 0.4 }).observe(meter);
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
        text: "Salty Hive just launched ThrHIVE: free CrossFit for local recovery programs. Liftoff Dec 11, Thrive Throwdown Dec 12.",
        url: window.location.href.split("#")[0],
      };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(data.url);
        toast("Link copied. Send it!");
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
      el.className = Math.random() < 0.35 ? "hex hex--ring" : "hex";
      const sz = 10 + Math.random() * 12;
      el.style.width = `${sz}px`; el.style.height = `${sz * 1.15}px`;
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
    const levels = [[0, "Cold start"], [3, "Warming up"], [10, "Getting salty"], [20, "Swarming"], [35, "Hive mind"], [50, "FULL SEND"]];
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

  /* ------------------------------------------------------------------------
     Giving math (everything derives from the program cost in the config)
     ------------------------------------------------------------------------ */
  const G = Object.assign({ programCost: 4000, programWeeks: 12, links: {}, swarm: [], once: [] }, C.giving || {});
  const COST = Number(G.programCost) || 4000;
  const WEEKS = Number(G.programWeeks) || 12;
  const WEEK = COST / WEEKS;
  const membersFor = (perYear) => Math.ceil(COST / perYear);
  const calc = {
    programCost: money(COST),
    week: money(WEEK),
    year: money(COST * 4),
    membersAt5: String(membersFor(5 * 12)),
  };
  $$("[data-money]").forEach((el) => { if (calc[el.dataset.money]) el.textContent = calc[el.dataset.money]; });
  $$("[data-calc]").forEach((el) => { if (calc[el.dataset.calc]) el.textContent = calc[el.dataset.calc]; });
  const tierOpt = { program: `Program Sponsor (${money(COST)})`, year: `Year-Round Sponsor (${money(COST * 4)})` };
  $$('#apiary-form option').forEach((o) => { if (tierOpt[o.value]) o.textContent = tierOpt[o.value]; });

  // "$333 funds a week": allow a dollar of rounding so $333 counts as 1/12 of $4,000
  const weeksOf = (amt) => {
    const w = amt / WEEK;
    return Math.abs(w - Math.round(w)) < 0.05 ? String(Math.round(w)) : w.toFixed(1);
  };
  const atLeastAWeek = (amt) => amt >= WEEK - 1;

  const impactLine = (freq, amt) => {
    if (!amt || amt <= 0) return "";
    if (freq === "once") {
      if (amt >= COST - 1) {
        const n = Math.max(1, Math.round(amt / COST * 10) / 10);
        return `That funds <em>${n > 1 ? n + " full programs" : "a full " + WEEKS + "-week program"}</em> on its own.`;
      }
      if (atLeastAWeek(amt)) {
        const label = weeksOf(amt);
        return `That funds <em>${label} week${label === "1" ? "" : "s"}</em> of a ${WEEKS}-week program.`;
      }
      return `<em>${membersFor(amt)} gifts</em> like yours fund a full ${WEEKS}-week program.`;
    }
    const perYear = freq === "monthly" ? amt * 12 : amt;
    if (perYear >= COST) return `You fund <em>a full ${WEEKS}-week program every year</em> on your own.`;
    return `<em>${membersFor(perYear)} members</em> giving like you fund a full ${WEEKS}-week program every year.`;
  };

  /* ------------------------------------------------------------------------
     The Swarm: frequency toggle + tiers + summary + checkout/pledge
     ------------------------------------------------------------------------ */
  const giver = $("#giver");
  const state = { freq: "monthly", amount: 5, name: "", custom: false };
  if (giver) {
    const tiersEl = $("#tiers");
    const customIn = $("#custom-amount");
    const btn = $("#giver-btn");
    const pledgeForm = $("#pledge-form");
    const groups = {
      monthly: { label: "The Swarm · monthly members", unit: "/mo", long: "/month", verb: "monthly", join: "You're joining the Swarm as" },
      yearly: { label: "The Swarm · yearly members", unit: "/yr", long: "/year", verb: "yearly", join: "You're joining the Swarm as" },
      once: { label: "One-time gifts", unit: "", long: " one time", verb: "once", join: "You're giving as a" },
    };
    const tiersFor = (freq) => (freq === "once" ? G.once : G.swarm.map((t) => ({ ...t, amount: freq === "yearly" ? t.amount * 12 : t.amount })));
    const mathFor = (freq, amt) => {
      if (freq === "once") return atLeastAWeek(amt) ? `${weeksOf(amt)} wk of a program` : `${membersFor(amt)} of these = 1 program`;
      const perYear = freq === "monthly" ? amt * 12 : amt;
      return perYear >= COST ? "1 full program / yr" : `${membersFor(perYear)} of you = 1 program / yr`;
    };

    const renderTiers = () => {
      const g = groups[state.freq];
      tiersEl.innerHTML = tiersFor(state.freq).map((t) => `
        <button type="button" class="tier" role="radio" aria-checked="${!state.custom && t.amount === state.amount}" data-amount="${t.amount}" data-name="${esc(t.name)}">
          <span class="tier__name">${esc(t.name)}</span>
          <span class="tier__amt">${money(t.amount)}<small>${g.unit}</small></span>
          <span class="tier__line">${esc(t.line || "")}</span>
          <span class="tier__math">${mathFor(state.freq, t.amount)}</span>
        </button>`).join("");
      $("#giver-group").textContent = g.label;
    };

    const checkoutUrl = () => {
      const base = (G.links || {})[state.freq];
      if (!base) return null;
      if (!G.amountParam) return base;
      try { const u = new URL(base); u.searchParams.set(G.amountParam, String(state.amount)); return u.toString(); }
      catch (e) { return base; }
    };

    const renderSummary = () => {
      const g = groups[state.freq];
      let you;
      if (state.freq === "once") you = `One-time gift · <b>${esc(state.custom ? "Your own amount" : state.name)}</b>`;
      else you = state.custom ? "You're joining <b>the Swarm</b>" : `You're joining the Swarm as <b>${esc(state.name)}</b>`;
      $("#giver-you").innerHTML = state.amount > 0 ? you : "Pick an amount";
      $("#giver-amount").innerHTML = state.amount > 0 ? `${money(state.amount)}<small>${g.long}</small>` : "$0";
      $("#giver-impact").innerHTML = impactLine(state.freq, state.amount);
      const url = checkoutUrl();
      const amountText = `${money(state.amount)}${state.freq === "once" ? "" : " " + g.verb}`;
      btn.textContent = `${url ? "Give" : "Pledge"} ${amountText} →`;
      if (url) { btn.href = url; btn.target = "_blank"; btn.rel = "noopener"; }
      else { btn.href = "#pledge-form"; btn.removeAttribute("target"); }
      btn.classList.toggle("is-disabled", !(state.amount > 0));
      const sub = $("#pledge-sub");
      if (sub) sub.textContent = `${money(state.amount || 0)}${state.freq === "once" ? " one time" : g.long}. We'll send your secure giving link the moment online giving is live. No payment today.`;
    };

    const pickFirst = () => {
      const list = tiersFor(state.freq);
      const t = list[0] || { amount: 5, name: "" };
      state.amount = t.amount; state.name = t.name; state.custom = false; customIn.value = "";
    };

    $$(".seg button", giver).forEach((b) => b.addEventListener("click", () => {
      state.freq = b.dataset.freq;
      $$(".seg button", giver).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      // keep the same tier position when switching between monthly and yearly
      const idx = Math.max(0, tiersFor(state.freq === "yearly" ? "monthly" : state.freq).findIndex((t) => t.name === state.name));
      if (!state.custom && state.freq !== "once" && G.swarm[idx]) {
        state.name = G.swarm[idx].name;
        state.amount = state.freq === "yearly" ? G.swarm[idx].amount * 12 : G.swarm[idx].amount;
      } else if (!state.custom) pickFirst();
      renderTiers(); renderSummary();
    }));
    tiersEl.addEventListener("click", (e) => {
      const t = e.target.closest(".tier");
      if (!t) return;
      state.amount = Number(t.dataset.amount); state.name = t.dataset.name; state.custom = false; customIn.value = "";
      renderTiers(); renderSummary();
    });
    customIn.addEventListener("input", () => {
      const v = Math.round(Number(customIn.value));
      if (v > 0) { state.amount = v; state.custom = true; }
      else { pickFirst(); }
      renderTiers(); renderSummary();
    });
    btn.addEventListener("click", (e) => {
      if (!(state.amount > 0)) { e.preventDefault(); customIn.focus(); return; }
      if (checkoutUrl()) return; // goes to checkout
      e.preventDefault();
      pledgeForm.hidden = false;
      pledgeForm.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      const first = pledgeForm.querySelector('input[name="name"]');
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 400);
    });

    // Start on monthly with the first tier (5 for Thrive) selected
    pickFirst();
    renderTiers(); renderSummary();
  }

  /* ------------------------------------------------------------------------
     Forms → Supabase (or a pre-filled email when no backend is set)
     ------------------------------------------------------------------------ */
  const B = C.backend || {};
  const hasBackend = !!(B.supabaseUrl && B.supabaseKey);
  const saveRecord = async (table, record) => {
    const headers = { apikey: B.supabaseKey, "Content-Type": "application/json", Prefer: "return=minimal" };
    if (/^eyJ/.test(B.supabaseKey)) headers.Authorization = `Bearer ${B.supabaseKey}`;
    const res = await fetch(`${B.supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`, { method: "POST", headers, body: JSON.stringify(record) });
    if (!res.ok) throw new Error(`Save failed (${res.status})`);
  };
  const mailFallback = (subject, lines) => {
    const body = lines.filter(Boolean).join("\n");
    window.location.href = `mailto:${C.email || "justin@saltyhivecrossfit.com"}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  const clean = (v, max) => String(v || "").trim().slice(0, max);

  const wireForm = (form, { table, build, subject, toLines, done }) => {
    if (!form) return;
    const note = form.querySelector("[data-form-note]");
    const submit = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      note.textContent = ""; note.classList.remove("is-error");
      if (form.website && form.website.value) return; // bot trap
      let ok = true;
      $$("input[required]", form).forEach((i) => {
        const bad = !i.value.trim() || !i.checkValidity();
        i.setAttribute("aria-invalid", String(bad));
        if (bad && ok) { ok = false; i.focus(); }
      });
      if (!ok) { note.textContent = "Add your name and a valid email so we can reach you."; note.classList.add("is-error"); return; }
      const record = build(new FormData(form));
      submit.disabled = true;
      const old = submit.innerHTML;
      submit.textContent = "Sending…";
      try {
        if (hasBackend) await saveRecord(table, record);
        else mailFallback(subject, toLines(record));
        const d = done(record);
        const box = document.createElement("div");
        box.className = "form__done";
        box.innerHTML = `<h3>${d.title}</h3><p>${d.body}</p>${hasBackend ? "" : '<p class="form__sub">Your email app just opened with everything filled in. Hit send and you\'re set.</p>'}`;
        form.appendChild(box);
        form.classList.add("is-done");
        const r = form.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + 60, 40);
        toast(d.toast);
      } catch (err) {
        note.textContent = "That didn't go through. Try again, or text the Hive at (801) 449-0478.";
        note.classList.add("is-error");
      } finally {
        submit.disabled = false; submit.innerHTML = old;
      }
    });
  };

  wireForm($("#signup-form"), {
    table: "signups",
    subject: "Thrive Throwdown: put me on the early list",
    build: (fd) => ({
      name: clean(fd.get("name"), 120),
      email: clean(fd.get("email"), 200),
      phone: clean(fd.get("phone"), 40) || null,
      home_gym: clean(fd.get("home_gym"), 120) || null,
      roles: fd.getAll("roles").map(String).slice(0, 4),
      days: String(fd.get("days") || "both"),
    }),
    toLines: (r) => [
      "Put me on the Thrive Throwdown early list!", "",
      `Name: ${r.name}`, `Email: ${r.email}`, r.phone && `Phone: ${r.phone}`, r.home_gym && `Home gym: ${r.home_gym}`,
      `Coming to: ${r.roles.join(", ") || "not sure yet"}`, `Days: ${r.days}`,
    ],
    done: (r) => ({
      title: `You're on the list, ${esc(r.name.split(" ")[0])}.`,
      body: "You'll hear first when registration opens. Now go recruit your crew.",
      toast: "You're on the list",
    }),
  });

  wireForm($("#pledge-form"), {
    table: "pledges",
    subject: "ThrHIVE pledge",
    build: (fd) => ({
      kind: "individual",
      name: clean(fd.get("name"), 120),
      email: clean(fd.get("email"), 200),
      frequency: state.freq,
      amount: state.amount,
      tier: state.custom ? null : state.name,
    }),
    toLines: (r) => [
      "I want to pledge to ThrHIVE!", "",
      `Name: ${r.name}`, `Email: ${r.email}`,
      `Pledge: ${money(r.amount)} ${r.frequency === "once" ? "one time" : r.frequency}${r.tier ? ` (${r.tier})` : ""}`,
      "", "Send me the giving link when it's live.",
    ],
    done: (r) => ({
      title: r.frequency === "once" ? "Thank you for showing up." : "Welcome to the Swarm.",
      body: `Your ${money(r.amount)}${r.frequency === "once" ? "" : r.frequency === "monthly" ? "/month" : "/year"} pledge is locked in. We'll email your secure giving link the moment it's live.`,
      toast: "Pledge locked in",
    }),
  });

  wireForm($("#apiary-form"), {
    table: "pledges",
    subject: "ThrHIVE Apiary partnership",
    build: (fd) => ({
      kind: "partner",
      name: clean(fd.get("name"), 120),
      email: clean(fd.get("email"), 200),
      phone: clean(fd.get("phone"), 40) || null,
      company: clean(fd.get("company"), 160) || null,
      tier: String(fd.get("tier") || "other"),
      message: clean(fd.get("message"), 1000) || null,
    }),
    toLines: (r) => [
      "I'm interested in becoming a ThrHIVE Apiary partner.", "",
      `Name: ${r.name}`, r.company && `Company: ${r.company}`, `Email: ${r.email}`, r.phone && `Phone: ${r.phone}`,
      `Interested in: ${r.tier}`, r.message && `\n${r.message}`,
    ],
    done: () => ({
      title: "Let's build something.",
      body: "Thanks for reaching out. Justin will be in touch soon to talk through it.",
      toast: "Message sent",
    }),
  });

  /* ------------------------------------------------------------------------
     Register link from config
     ------------------------------------------------------------------------ */
  if (C.registerUrl) {
    const reg = $("#cta-register");
    reg.href = C.registerUrl; reg.hidden = false;
  }

  // A little celebration for every "I'm in" click too
  $$(".js-primary-cta").forEach((a) => a.addEventListener("click", (e) => {
    const r = a.getBoundingClientRect();
    burst(e.clientX || r.left + r.width / 2, e.clientY || r.top, 22);
  }));
})();
