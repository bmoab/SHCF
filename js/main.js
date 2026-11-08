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

  document.documentElement.classList.remove("no-js");

  /* ---------- Toast ---------- */
  const toastEl = $("#toast");
  let toastT;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("is-on"), 2600);
  };

  /* ---------- Confetti (hexes) ---------- */
  const confetti = $("#confetti");
  const burst = (x, y, n = 24) => {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("i");
      el.className = Math.random() < 0.35 ? "hex hex--light" : "hex";
      const sz = 10 + Math.random() * 12;
      el.style.width = `${sz}px`; el.style.height = `${sz * 1.15}px`;
      confetti.appendChild(el);
      const ang = Math.random() * Math.PI * 2, speed = 4 + Math.random() * 9;
      let vx = Math.cos(ang) * speed, vy = Math.sin(ang) * speed - 7, px = x, py = y, rot = Math.random() * 360, life = 0;
      const vr = (Math.random() - 0.5) * 20;
      const step = () => {
        life++; vy += 0.38; vx *= 0.985; px += vx; py += vy; rot += vr;
        el.style.transform = `translate(${px}px, ${py}px) rotate(${rot}deg)`;
        el.style.opacity = String(clamp(1 - life / 80, 0, 1));
        if (life < 80 && py < window.innerHeight + 40) requestAnimationFrame(step); else el.remove();
      };
      requestAnimationFrame(step);
    }
  };

  /* ---------- Nav state + scroll progress ---------- */
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

  /* ---------- Hero honeycomb ---------- */
  const canvas = $("#comb");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    let W = 0, H = 0, R = 34, cells = [], running = false, raf = 0;
    const mouse = { x: 0, y: 0, active: false };
    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = W < 640 ? 26 : 36;
      const w = Math.sqrt(3) * R, h = 1.5 * R;
      cells = [];
      for (let row = -1, y = 0; y < H + R * 2; row++, y = row * h)
        for (let col = -1; col * w < W + w; col++) cells.push({ x: col * w + (row % 2 ? w / 2 : 0), y, v: 0 });
    };
    const hex = (x, y, r) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        i ? ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)) : ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
      }
      ctx.closePath();
    };
    let last = performance.now();
    const draw = (now) => {
      const dt = Math.min(64, now - last); last = now;
      ctx.clearRect(0, 0, W, H);
      if (running && Math.random() < 0.18) { const c = cells[(Math.random() * cells.length) | 0]; if (c) c.v = Math.max(c.v, 0.55 + Math.random() * 0.45); }
      for (const c of cells) {
        if (mouse.active) {
          const t = clamp(1 - Math.hypot(c.x - mouse.x, c.y - mouse.y) / (R * 4.2), 0, 1);
          if (t > c.v) c.v += (t - c.v) * 0.35;
        }
        if (running) c.v *= Math.pow(0.955, dt / 16);
        const fade = clamp(c.x / W + 0.15, 0.12, 1) * clamp(1.25 - c.y / H, 0.25, 1);
        hex(c.x, c.y, R - 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(232,245,42,${(0.05 + c.v * 0.55) * fade})`;
        ctx.stroke();
        if (c.v > 0.04) { ctx.fillStyle = `rgba(232,245,42,${c.v * 0.16 * fade})`; ctx.fill(); }
      }
      if (running) raf = requestAnimationFrame(draw);
    };
    const drawStatic = () => { for (const c of cells) c.v = Math.random() < 0.06 ? 0.6 : 0; draw(performance.now()); };
    build();
    if (reduceMotion) drawStatic();
    else {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(draw); }
        else if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
      }).observe(hero);
      hero.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true; });
      hero.addEventListener("pointerleave", () => { mouse.active = false; });
    }
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { build(); if (reduceMotion) drawStatic(); }, 150); });
  }

  /* ---------- Countdown ---------- */
  const cdWrap = $("#countdown"), cdLabel = $("#countdown-label");
  const units = { d: $('[data-unit="d"]'), h: $('[data-unit="h"]'), m: $('[data-unit="m"]'), s: $('[data-unit="s"]') };
  const target = C.countdownTo ? new Date(C.countdownTo) : null;
  const pad = (n) => String(n).padStart(2, "0");
  if (target && !isNaN(target)) {
    cdWrap.dataset.state = "live";
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { cdLabel.textContent = "Throwdown day is here. Let's go!"; Object.values(units).forEach((u) => (u.textContent = "00")); return; }
      cdLabel.textContent = C.countdownLabel || "T-minus";
      units.d.textContent = pad(Math.floor(diff / 864e5));
      units.h.textContent = pad(Math.floor((diff / 36e5) % 24));
      units.m.textContent = pad(Math.floor((diff / 6e4) % 60));
      units.s.textContent = pad(Math.floor((diff / 1e3) % 60));
      setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
  } else {
    cdLabel.textContent = "Date coming soon";
    const scramble = () => Object.values(units).forEach((u) => (u.textContent = pad((Math.random() * 100) | 0)));
    scramble();
    if (!reduceMotion) setInterval(scramble, 90);
  }

  /* ---------- Throwdown details ---------- */
  const details = $("#details");
  if (details && Array.isArray(C.details)) {
    details.innerHTML = C.details.map((c, i) => c.value
      ? `<article class="card card--open reveal" style="--d:${i * 0.06}s"><p class="card__label">${esc(c.label)}</p><h4 class="card__value">${esc(c.value)}</h4>${c.detail ? `<p class="card__detail">${esc(c.detail)}</p>` : ""}</article>`
      : `<article class="card card--soon reveal" style="--d:${i * 0.06}s"><p class="card__label">${esc(c.label)}<span class="card__pulse" aria-hidden="true"></span></p><h4 class="card__value">Coming soon</h4><p class="card__detail">${esc(c.teaser || "")}</p></article>`
    ).join("");
  }
  if (C.registerUrl) { const reg = $("#cta-register"); reg.href = C.registerUrl; reg.hidden = false; }

  /* ---------- Giving math ---------- */
  const G = Object.assign({ programCost: 4000, programWeeks: 12, links: {}, swarm: [], once: [] }, C.giving || {});
  const COST = Number(G.programCost) || 4000;
  const WEEKS = Number(G.programWeeks) || 12;
  const WEEK = COST / WEEKS;
  const membersFor = (perYear) => Math.ceil(COST / perYear);
  const calc = { programCost: money(COST), year: money(COST * 4) };
  $$("[data-money]").forEach((el) => { if (calc[el.dataset.money]) el.textContent = calc[el.dataset.money]; });
  const weeksOf = (amt) => { const w = amt / WEEK; return Math.abs(w - Math.round(w)) < 0.05 ? String(Math.round(w)) : w.toFixed(1); };
  const atLeastAWeek = (amt) => amt >= WEEK - 1; // $333 counts as one week of $4,000

  const impactLine = (freq, amt) => {
    if (!(amt > 0)) return "";
    if (freq === "once") {
      if (amt >= COST - 1) return `That funds <em>a full ${WEEKS}-week program</em>.`;
      if (atLeastAWeek(amt)) { const w = weeksOf(amt); return `That funds <em>${w} week${w === "1" ? "" : "s"}</em> of a program.`; }
      return `<em>${membersFor(amt)} gifts</em> like this fund a full program.`;
    }
    const perYear = freq === "monthly" ? amt * 12 : amt;
    if (perYear >= COST) return `That funds <em>a full program every year</em>.`;
    return `<em>${membersFor(perYear)} people</em> giving this fund a full program every year.`;
  };

  /* ---------- The Swarm: giving picker ---------- */
  const giver = $("#giver");
  const state = { freq: "monthly", amount: 5, name: "", custom: false };
  if (giver) {
    const tiersEl = $("#tiers"), customIn = $("#custom-amount"), btn = $("#giver-btn"), pledgeForm = $("#pledge-form");
    const unit = { monthly: "/mo", yearly: "/yr", once: "" };
    const verb = { monthly: " monthly", yearly: " yearly", once: "" };
    const tiersFor = (freq) => (freq === "once" ? G.once : G.swarm.map((t) => ({ ...t, amount: freq === "yearly" ? t.amount * 12 : t.amount })));
    const checkoutUrl = () => {
      const base = (G.links || {})[state.freq];
      if (!base || !G.amountParam) return base || null;
      try { const u = new URL(base); u.searchParams.set(G.amountParam, String(state.amount)); return u.toString(); } catch (e) { return base; }
    };
    const render = () => {
      tiersEl.innerHTML = tiersFor(state.freq).map((t) => `
        <button type="button" class="tier" role="radio" aria-checked="${!state.custom && t.amount === state.amount}" data-amount="${t.amount}" data-name="${esc(t.name)}">
          <span class="tier__name">${esc(t.name)}</span>
          <span class="tier__amt">${money(t.amount)}<small>${unit[state.freq]}</small></span>
        </button>`).join("");
      $("#giver-impact").innerHTML = impactLine(state.freq, state.amount);
      const url = checkoutUrl();
      btn.textContent = `${url ? "Give" : "Pledge"} ${money(state.amount || 0)}${verb[state.freq]}`;
      if (url) { btn.href = url; btn.target = "_blank"; btn.rel = "noopener"; } else { btn.href = "#pledge-form"; btn.removeAttribute("target"); }
    };
    const pickFirst = () => { const t = tiersFor(state.freq)[0] || { amount: 5, name: "" }; state.amount = t.amount; state.name = t.name; state.custom = false; customIn.value = ""; };

    $$(".seg button", giver).forEach((b) => b.addEventListener("click", () => {
      const idx = Math.max(0, tiersFor(state.freq).findIndex((t) => t.name === state.name));
      const wasSwarm = state.freq !== "once";
      state.freq = b.dataset.freq;
      $$(".seg button", giver).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      if (!state.custom && wasSwarm && state.freq !== "once" && G.swarm[idx]) {
        state.name = G.swarm[idx].name;
        state.amount = state.freq === "yearly" ? G.swarm[idx].amount * 12 : G.swarm[idx].amount;
      } else if (!state.custom) pickFirst();
      render();
    }));
    tiersEl.addEventListener("click", (e) => {
      const t = e.target.closest(".tier"); if (!t) return;
      state.amount = Number(t.dataset.amount); state.name = t.dataset.name; state.custom = false; customIn.value = "";
      render();
    });
    customIn.addEventListener("input", () => {
      const v = Math.round(Number(customIn.value));
      if (v > 0) { state.amount = v; state.custom = true; } else pickFirst();
      render();
    });
    btn.addEventListener("click", (e) => {
      if (!(state.amount > 0)) { e.preventDefault(); customIn.focus(); return; }
      if (checkoutUrl()) return;
      e.preventDefault();
      $("#pledge-sub").textContent = `${money(state.amount)}${state.freq === "once" ? " one time" : verb[state.freq]}. We'll email you a secure link when online giving is live. No payment today.`;
      pledgeForm.hidden = false;
      pledgeForm.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      setTimeout(() => pledgeForm.querySelector('input[name="name"]').focus({ preventScroll: true }), 400);
    });
    pickFirst(); render();
  }

  /* ---------- Program tracker ---------- */
  const meter = $("#meter");
  if (meter) {
    const prog = (Array.isArray(C.programs) && C.programs[0]) || { name: "Program 01", goal: COST };
    const goal = Number(prog.goal) || COST, raised = Math.max(0, Number(prog.raised) || 0), CELLS = 20;
    const comb = $("#meter-comb");
    comb.innerHTML = Array.from({ length: CELLS }, (_, i) => `<i style="--i:${i}"></i>`).join("");
    $("#meter-title").textContent = prog.name || "Program 01";
    $("#meter-status").textContent = raised ? `${money(raised)} of ${money(goal)}` : `${money(goal)} goal`;
    meter.dataset.state = raised ? "live" : "waiting";
    if (raised) {
      const on = Math.min(CELLS, Math.round((raised / goal) * CELLS));
      new IntersectionObserver(([e], o) => { if (!e.isIntersecting) return; $$("i", comb).forEach((c, i) => c.classList.toggle("is-on", i < on)); o.disconnect(); }, { threshold: 0.4 }).observe(meter);
    }
  }

  /* ---------- Partner form toggle ---------- */
  const pToggle = $("#partner-toggle"), pForm = $("#apiary-form");
  if (pToggle && pForm) {
    pToggle.addEventListener("click", () => {
      pForm.hidden = !pForm.hidden;
      pToggle.setAttribute("aria-expanded", String(!pForm.hidden));
      if (!pForm.hidden) setTimeout(() => pForm.querySelector('input[name="name"]').focus(), 50);
    });
  }

  /* ---------- Forms: Supabase, or a pre-filled email ---------- */
  const B = C.backend || {};
  const hasBackend = !!(B.supabaseUrl && B.supabaseKey);
  const saveRecord = async (table, record) => {
    const headers = { apikey: B.supabaseKey, "Content-Type": "application/json", Prefer: "return=minimal" };
    if (/^eyJ/.test(B.supabaseKey)) headers.Authorization = `Bearer ${B.supabaseKey}`;
    const res = await fetch(`${B.supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`, { method: "POST", headers, body: JSON.stringify(record) });
    if (!res.ok) throw new Error(`Save failed (${res.status})`);
  };
  const mailFallback = (subject, lines) => {
    window.location.href = `mailto:${C.email || "justin@saltyhivecrossfit.com"}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.filter(Boolean).join("\n"))}`;
  };
  const clean = (v, max) => String(v || "").trim().slice(0, max);

  const wireForm = (form, { table, build, subject, toLines, done }) => {
    if (!form) return;
    const note = form.querySelector("[data-form-note]"), submit = form.querySelector('button[type="submit"]');
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
      if (!ok) { note.textContent = "Please add your name and a valid email."; note.classList.add("is-error"); return; }
      const record = build(new FormData(form));
      const old = submit.innerHTML;
      submit.disabled = true; submit.textContent = "Sending…";
      try {
        if (hasBackend) await saveRecord(table, record); else mailFallback(subject, toLines(record));
        const d = done(record);
        const box = document.createElement("div");
        box.className = "form__done";
        box.innerHTML = `<h3>${d.title}</h3><p>${d.body}</p>${hasBackend ? "" : '<p class="form__sub">Your email app opened with everything filled in. Just hit send.</p>'}`;
        form.appendChild(box);
        form.classList.add("is-done");
        const r = form.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + 60, 36);
        toast(d.toast);
      } catch (err) {
        note.textContent = "That didn't go through. Please try again, or text (801) 449-0478.";
        note.classList.add("is-error");
      } finally { submit.disabled = false; submit.innerHTML = old; }
    });
  };

  wireForm($("#signup-form"), {
    table: "signups",
    subject: "Thrive Throwdown sign-up",
    build: (fd) => ({
      name: clean(fd.get("name"), 120), email: clean(fd.get("email"), 200),
      phone: clean(fd.get("phone"), 40) || null, home_gym: clean(fd.get("home_gym"), 120) || null,
      roles: fd.getAll("roles").map(String).slice(0, 4),
    }),
    toLines: (r) => ["Sign me up for the Thrive Throwdown.", "", `Name: ${r.name}`, `Email: ${r.email}`, r.phone && `Phone: ${r.phone}`, r.home_gym && `Gym: ${r.home_gym}`, `I want to: ${r.roles.join(", ") || "not sure yet"}`],
    done: (r) => ({ title: `You're on the list, ${esc(r.name.split(" ")[0])}.`, body: "We'll let you know when registration opens.", toast: "You're on the list" }),
  });

  wireForm($("#pledge-form"), {
    table: "pledges",
    subject: "ThrHIVE pledge",
    build: (fd) => ({ kind: "individual", name: clean(fd.get("name"), 120), email: clean(fd.get("email"), 200), frequency: state.freq, amount: state.amount, tier: state.custom ? null : state.name }),
    toLines: (r) => ["I'd like to give to ThrHIVE.", "", `Name: ${r.name}`, `Email: ${r.email}`, `Pledge: ${money(r.amount)} ${r.frequency === "once" ? "one time" : r.frequency}${r.tier ? ` (${r.tier})` : ""}`],
    done: (r) => ({ title: "Thank you.", body: `Your ${money(r.amount)}${r.frequency === "once" ? "" : r.frequency === "monthly" ? "/month" : "/year"} pledge is in. We'll email your giving link soon.`, toast: "Pledge received" }),
  });

  wireForm($("#apiary-form"), {
    table: "pledges",
    subject: "ThrHIVE partnership",
    build: (fd) => ({ kind: "partner", name: clean(fd.get("name"), 120), email: clean(fd.get("email"), 200), phone: clean(fd.get("phone"), 40) || null, company: clean(fd.get("company"), 160) || null, tier: String(fd.get("tier") || "other"), message: clean(fd.get("message"), 1000) || null }),
    toLines: (r) => ["I'm interested in partnering with ThrHIVE.", "", `Name: ${r.name}`, r.company && `Organization: ${r.company}`, `Email: ${r.email}`, r.phone && `Phone: ${r.phone}`, `Interested in: ${r.tier}`, r.message && `\n${r.message}`],
    done: () => ({ title: "Thanks for reaching out.", body: "Justin will be in touch soon.", toast: "Message sent" }),
  });

  /* ---------- Save the date (.ics) ---------- */
  const calBtn = $("#cta-cal");
  if (calBtn) {
    const events = Array.isArray(C.calendar) ? C.calendar : [];
    if (!events.length) calBtn.hidden = true;
    calBtn.addEventListener("click", () => {
      const utc = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const nextDay = (s) => { const d = new Date(`${s}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ""); };
      const icsEsc = (s) => String(s).replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
      const loc = icsEsc(`Salty Hive CrossFit, ${C.address || "4050 S Howick St, Salt Lake City, UT 84107"}`);
      const desc = icsEsc(`Benefiting ThrHIVE: CrossFit for the communities that need it most.${C.registerUrl ? " Register: " + C.registerUrl : ""}`);
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ThrHIVE//Thrive Throwdown//EN", "CALSCALE:GREGORIAN"];
      events.forEach((ev, i) => {
        lines.push("BEGIN:VEVENT", `UID:thrhive-${i}-${ev.date || ev.start}@thrhive`, `DTSTAMP:${utc(new Date())}`);
        if (ev.start) { const s = new Date(ev.start), en = ev.end ? new Date(ev.end) : new Date(s.getTime() + 4 * 36e5); lines.push(`DTSTART:${utc(s)}`, `DTEND:${utc(en)}`); }
        else lines.push(`DTSTART;VALUE=DATE:${ev.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${nextDay(ev.date)}`);
        lines.push(`SUMMARY:${icsEsc(ev.title)}`, `LOCATION:${loc}`, `DESCRIPTION:${desc}`, "END:VEVENT");
      });
      lines.push("END:VCALENDAR");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
      a.download = "thrive-throwdown.ics";
      document.body.appendChild(a); a.click(); a.remove();
      toast("Saved. See you Dec 11–12");
    });
  }

  /* ---------- Announcement video (loads on tap) ---------- */
  const yt = $("#yt");
  if (yt) yt.addEventListener("click", () => {
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${C.youtubeId || "nTL6EOq-iPo"}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
    f.title = "ThrHIVE announcement";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.allowFullscreen = true;
    yt.replaceChildren(f); yt.style.cursor = "default";
  }, { once: true });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-in"); io.unobserve(e.target);
  }), { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Magnetic buttons (desktop) ---------- */
  if (finePointer && !reduceMotion) $$(".magnetic").forEach((b) => {
    b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`; });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });
})();
