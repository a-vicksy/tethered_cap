/* ————— I'm Attached · scene engine + pledge ————— */
(function () {
  "use strict";

  const staticMode = new URLSearchParams(location.search).has("static");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || staticMode;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  /* ————— tokens ————— */
  const C = {
    cream: "#f3ebdf", forest: "#153824", deep: "#061e13",
    green: "#2ab574", moss: "#bece9f", powder: "#bed2eb", ink: "#10271b",
  };

  /* ————— scroll scenes ————— */
  if (hasGsap && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    /* Build scenes only once layout is stable (fonts + full load),
       so pin dimensions are never measured mid-layout. */
    const whenStable = Promise.all([
      new Promise((res) => (document.readyState === "complete" ? res() : window.addEventListener("load", res, { once: true }))),
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    ]).then(() => new Promise((res) => {
      let done = false;
      const fin = () => { if (!done) { done = true; res(); } };
      requestAnimationFrame(() => requestAnimationFrame(fin));
      setTimeout(fin, 350); /* rAF can be throttled in background tabs */
    }));

    whenStable.then(buildScenes);
  } else {
    document.documentElement.classList.add("static-flow");
    document.body.classList.add("static-flow");
    $("#indiaNumber").textContent = (25e9).toLocaleString("en-IN");
  }

  function buildScenes() {
    /* ONE continuous shot: the unscrewing, then the camera follows the cap down.
       Same cap element throughout — nothing to hand off, nothing to break. */
    const tl = gsap.timeline({
      scrollTrigger: { trigger: "#story", start: "top top", end: "+=680%", scrub: 0.6, pin: true },
    });

    /* Phase A — the unscrew (you cause the breakup) */
    tl.to("#cap", { rotation: 360, y: -30, duration: 1.6, ease: "none" }, 0)
      .to("#cue", { opacity: 0, duration: 0.3 }, 0)
      .to("#line1", { opacity: 0, y: -30, duration: 0.8 }, 0.8)
      .fromTo("#line2", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, 1.2)
      .to("#cap", { rotation: 620, y: -170, x: 40, duration: 1.0, ease: "power1.out" }, 1.6)
      .fromTo("#heroNote", { opacity: 0 }, { opacity: 1, duration: 0.6 }, 2.0)
      .to("#heroNote", { opacity: 0, duration: 0.5 }, 3.0)

    /* Phase B — the camera drops with the cap: bottle & headline exit upward */
      .to("#line2", { opacity: 0, y: -30, duration: 0.5 }, 2.6)
      .to(".kicker", { opacity: 0, duration: 0.4 }, 2.6)
      .to("#bottleBody", { y: () => -window.innerHeight * 1.4, duration: 1.4, ease: "power2.in" }, 2.7)
      .to("#cap", { y: 60, x: 0, duration: 1.4, ease: "power1.inOut" }, 2.7)

    /* Phase C — the world passes: street → drain → river → sea */
      .to("#fallWorld", { y: "-505vh", duration: 6.9, ease: "none" }, 3.1)
      .to("#cap", { rotation: "+=680", duration: 6.9, ease: "none" }, 3.1)
      .to("#cap", { x: 44, yoyo: true, repeat: 4, duration: 1.35, ease: "sine.inOut" }, 3.3)

    /* water swallows the light */
      .to("#story", { backgroundColor: "#e7e9dd", duration: 1.2, ease: "none" }, 3.1)
      .to("#story", { backgroundColor: C.powder, duration: 1.6, ease: "none" }, 4.6)
      .to("#story", { backgroundColor: "#6f96b8", duration: 1.5, ease: "none" }, 6.4)
      .to("#story", { backgroundColor: C.forest, duration: 1.4, ease: "none" }, 7.9)
      .to("#story", { backgroundColor: C.deep, duration: 0.8, ease: "none" }, 9.2)

    /* the cap comes to rest among the others on the seabed */
      .to("#cap", { y: 210, rotation: "+=40", duration: 0.7, ease: "power1.out" }, 9.3);

    const beat = (sel, at, hold) => {
      tl.fromTo(sel, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5 }, at);
      tl.to(sel, { opacity: 0, y: -22, duration: 0.4 }, at + hold);
    };
    beat(".b1", 3.5, 1.0);
    beat(".b2", 4.8, 1.1);
    beat(".b3", 6.1, 1.0);
    beat(".b4", 7.3, 1.0);
    beat(".b5", 8.5, 1.2);

    /* gentle reveals for flowing copy */
    $$(".fix-copy p, .fix-line, .fix-diagram, .india .col > *, .deep .col > *, .pledge-left > *, .wall-title, .wall-share > *").forEach((el) => {
      gsap.from(el, {
        opacity: 0, y: 30, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    /* re-measure pins once assets settle or the viewport changes size
       (some embedded webviews resize without firing window.resize) */
    window.addEventListener("load", () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    let rsT, lastW = window.innerWidth, lastH = window.innerHeight;
    new ResizeObserver(() => {
      if (window.innerWidth === lastW && window.innerHeight === lastH) return;
      lastW = window.innerWidth; lastH = window.innerHeight;
      clearTimeout(rsT);
      rsT = setTimeout(() => ScrollTrigger.refresh(), 180);
    }).observe(document.documentElement);

    /* india number counts up when reached */
    const num = $("#indiaNumber");
    const counter = { v: 0 };
    gsap.to(counter, {
      v: 25e9, duration: 2.4, ease: "power2.out",
      scrollTrigger: { trigger: num, start: "top 80%" },
      onUpdate: () => { num.textContent = Math.round(counter.v).toLocaleString("en-IN"); },
    });
  }

  /* ————— floating bar ————— */
  const bar = $("#bar");
  const onScroll = () => {
    /* appear once the story shot ends (pin is ~6.8 viewports long) */
    const past = window.scrollY > window.innerHeight * 7;
    bar.classList.toggle("is-on", past);
    bar.setAttribute("aria-hidden", String(!past));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  $$("[data-goto]").forEach((b) => b.addEventListener("click", () => {
    $(b.dataset.goto).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }));

  /* ————— objection stickers ————— */
  $$("[data-flip]").forEach((s) => s.addEventListener("click", () => s.classList.toggle("is-flipped")));

  /* ————— pledge state ————— */
  const SEED = 12437;
  const store = {
    get me() { try { return JSON.parse(localStorage.getItem("iamattached") || "null"); } catch { return null; } },
    set me(v) { localStorage.setItem("iamattached", JSON.stringify(v)); },
  };
  const countEls = [$("#pledgeCount"), $("#barCount")];
  const renderCount = () => {
    const n = SEED + (store.me ? 1 : 0);
    countEls.forEach((el) => { el.textContent = n.toLocaleString("en-IN"); });
  };

  const vowName = $("#vowName"), vowCity = $("#vowCity");
  const signBtn = $("#signBtn"), dlBtn = $("#dlBtn"), shareBtn = $("#shareBtn");
  let photoImg = null;
  let way = 0;
  let signed = false;

  /* colourways — from the reference pledge cards */
  const WAYS = [
    { bg: C.cream,  circle: C.moss,   ring: "#8fae63", text: "#1c6b3c", name: C.forest, sub: "#6b7a5a", mark: C.forest, mono: "#1c6b3c" },
    { bg: C.powder, circle: C.forest, ring: "#0d2818", text: C.cream,  name: C.cream,  sub: C.powder,  mark: C.forest, mono: C.forest },
    { bg: "#123a24", circle: C.powder, ring: "#98b6d8", text: C.forest, name: C.forest, sub: "#4a6a8a", mark: C.cream, mono: C.cream },
  ];

  /* ————— card renderer (1080×1350) ————— */
  const canvas = $("#cardCanvas");
  const ctx = canvas.getContext("2d");

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCard() {
    const w = WAYS[way];
    const W = 1080, H = 1350, cx = W / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = w.bg;
    ctx.fillRect(0, 0, W, H);

    /* header */
    ctx.fillStyle = w.mark === C.cream ? C.cream : C.forest;
    ctx.font = '600 30px "Fields", Georgia, serif';
    ctx.textAlign = "center";
    const header = "T H E   T E T H E R E D   C A P   M A N D A T E   2 0 2 6";
    ctx.fillText(header, cx, 92);

    /* crimped circle: tick ring + fill */
    const cy = 560, R = 356;
    ctx.strokeStyle = w.circle;
    ctx.lineWidth = 7;
    for (let i = 0; i < 88; i++) {
      const a = (i / 88) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (R + 8), cy + Math.sin(a) * (R + 8));
      ctx.lineTo(cx + Math.cos(a) * (R + 26), cy + Math.sin(a) * (R + 26));
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = w.circle;
    ctx.fill();

    /* photo or monogram */
    const pr = 128, py = cy - 168;
    if (photoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, py, pr, 0, Math.PI * 2);
      ctx.clip();
      const s = Math.max((pr * 2) / photoImg.width, (pr * 2) / photoImg.height);
      ctx.drawImage(photoImg, cx - (photoImg.width * s) / 2, py - (photoImg.height * s) / 2, photoImg.width * s, photoImg.height * s);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, py, pr, 0, Math.PI * 2);
      ctx.strokeStyle = w.bg;
      ctx.lineWidth = 10;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = w.bg;
      ctx.fill();
      ctx.fillStyle = w.mono;
      ctx.font = '500 120px "Fields Display", Georgia, serif';
      const nm = (vowName.textContent || "").trim();
      ctx.fillText(nm ? nm.trim().split(/\s+/).map((p) => p[0].toUpperCase()).slice(0, 2).join("") : "?", cx, py + 42);
    }

    /* the line */
    ctx.fillStyle = w.text;
    ctx.font = '500 108px "Fields Display", Georgia, serif';
    ctx.fillText("I'm", cx, cy + 92);
    ctx.fillText("Attached.", cx, cy + 196);

    /* name + city */
    const nm = (vowName.textContent || "").trim() || "Your name";
    const ct = (vowCity.textContent || "").trim() || "Your city";
    ctx.font = '500 46px "Fields", Georgia, serif';
    ctx.fillStyle = w.name === w.circle ? w.text : w.name;
    ctx.fillText(nm, cx, cy + 278);
    ctx.font = '300 36px "Fields", Georgia, serif';
    ctx.fillStyle = w.sub;
    ctx.fillText(ct, cx, cy + 326);

    /* bottle mark */
    const by = 1042, bw = 118, bh = 200;
    ctx.strokeStyle = w.mark;
    ctx.lineWidth = 6;
    roundRect(cx - 26, by, 52, 30, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 20, by + 30);
    ctx.bezierCurveTo(cx - 20, by + 52, cx - bw / 2, by + 60, cx - bw / 2, by + 96);
    ctx.lineTo(cx - bw / 2, by + bh - 20);
    ctx.quadraticCurveTo(cx - bw / 2, by + bh, cx - bw / 2 + 20, by + bh);
    ctx.lineTo(cx + bw / 2 - 20, by + bh);
    ctx.quadraticCurveTo(cx + bw / 2, by + bh, cx + bw / 2, by + bh - 20);
    ctx.lineTo(cx + bw / 2, by + 96);
    ctx.bezierCurveTo(cx + bw / 2, by + 60, cx + 20, by + 52, cx + 20, by + 30);
    ctx.stroke();
    ctx.fillStyle = w.mark;
    ctx.font = '500 27px "Fields Display", Georgia, serif';
    ctx.fillText("ATTACH", cx, by + 104);
    ctx.fillText("YOUR", cx, by + 136);
    ctx.fillText("SELF", cx, by + 168);

    ctx.font = '500 28px "Fields", Georgia, serif';
    ctx.fillText("tetheredcap.org", cx, 1306);
  }

  /* redraw when fonts are truly ready */
  const redraw = () => requestAnimationFrame(drawCard);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);

  /* ————— pledge interactions ————— */
  const validate = () => {
    const ok = (vowName.textContent || "").trim().length > 1 && (vowCity.textContent || "").trim().length > 1;
    signBtn.disabled = !ok || signed;
    return ok;
  };
  [vowName, vowCity].forEach((el) => {
    el.addEventListener("input", () => { validate(); redraw(); });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); el.blur(); } });
    el.addEventListener("paste", (e) => {
      e.preventDefault();
      document.execCommand("insertText", false, (e.clipboardData.getData("text/plain") || "").replace(/\n/g, " ").slice(0, 40));
    });
  });

  $("#photoIn").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => { photoImg = img; $("#photoNote").textContent = "photo added — it stays on this device"; redraw(); };
    img.src = URL.createObjectURL(f);
  });

  $$(".way").forEach((b) => b.addEventListener("click", () => {
    way = Number(b.dataset.way);
    $$(".way").forEach((x) => x.classList.toggle("is-on", x === b));
    redraw();
  }));

  function addToWall(entry, you) {
    const d = document.createElement("div");
    d.className = "wcap" + (you ? " is-you" : "");
    if (you && photoImg) {
      const im = document.createElement("img");
      im.src = photoImg.src;
      im.alt = entry.n;
      d.appendChild(im);
    } else {
      const i = document.createElement("span");
      i.className = "wcap-i";
      i.textContent = entry.n.split(/\s+/).map((p) => p[0]).slice(0, 2).join("");
      d.appendChild(i);
    }
    const n = document.createElement("span");
    n.className = "wcap-n";
    n.textContent = entry.n;
    const c = document.createElement("span");
    c.className = "wcap-c";
    c.textContent = entry.c;
    d.append(n, c);
    d.title = `${entry.n} · ${entry.c}`;
    const grid = $("#wallGrid");
    grid.insertBefore(d, grid.firstChild);
  }

  signBtn.addEventListener("click", () => {
    if (!validate() || signed) return;
    signed = true;
    const me = { n: (vowName.textContent || "").trim(), c: (vowCity.textContent || "").trim(), t: 0 };
    store.me = me;
    renderCount();
    addToWall(me, true);
    dlBtn.disabled = shareBtn.disabled = false;
    signBtn.textContent = "You're attached ✓";
    signBtn.disabled = true;
    if (hasGsap && !reduceMotion) {
      gsap.fromTo(".card-wrap", { scale: 0.94, rotate: -2 }, { scale: 1, rotate: 1.6, duration: 0.7, ease: "back.out(2.2)" });
      gsap.fromTo("#pledgeCount", { scale: 1.5, color: "#2ab574" }, { scale: 1, color: "#153824", duration: 0.9 });
    }
    redraw();
  });

  const fileName = () => `i-am-attached-${((vowName.textContent || "card").trim() || "card").toLowerCase().replace(/\s+/g, "-")}.png`;

  dlBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = fileName();
    a.href = canvas.toDataURL("image/png");
    a.click();
  });

  shareBtn.addEventListener("click", async () => {
    canvas.toBlob(async (blob) => {
      const file = new File([blob], fileName(), { type: "image/png" });
      const data = {
        files: [file],
        title: "I'm Attached.",
        text: "I just attached myself to the Tethered Cap Mandate. Caps shouldn't leave their bottles. tetheredcap.org",
      };
      if (navigator.canShare && navigator.canShare(data)) {
        try { await navigator.share(data); } catch { /* user closed the sheet */ }
      } else {
        dlBtn.click();
      }
    }, "image/png");
  });

  /* ————— the wall (seeded — swap for API later) ————— */
  const SEED_WALL = [
    ["Aarav", "Mumbai"], ["Ananya", "Bengaluru"], ["Vihaan", "Delhi"], ["Diya", "Pune"],
    ["Kabir", "Jaipur"], ["Ishita", "Kolkata"], ["Rohan", "Chennai"], ["Meera", "Kochi"],
    ["Arjun", "Hyderabad"], ["Sara", "Goa"], ["Dev", "Ahmedabad"], ["Nisha", "Lucknow"],
    ["Advait", "Indore"], ["Tara", "Bhopal"], ["Reyansh", "Nagpur"], ["Zoya", "Srinagar"],
    ["Krish", "Surat"], ["Anika", "Chandigarh"], ["Vivaan", "Patna"], ["Pari", "Guwahati"],
    ["Aditya", "Thane"], ["Riya", "Noida"], ["Yash", "Rajkot"], ["Aisha", "Varanasi"],
    ["Shaurya", "Mysuru"], ["Navya", "Coimbatore"], ["Atharv", "Ranchi"], ["Kiara", "Dehradun"],
    ["Om", "Udaipur"], ["Fatima", "Bhubaneswar"], ["Laksh", "Amritsar"], ["Inaaya", "Shillong"],
    ["Veer", "Vadodara"], ["Myra", "Visakhapatnam"], ["Ayaan", "Raipur"], ["Ira", "Trivandrum"],
  ];
  SEED_WALL.reverse().forEach(([n, c]) => addToWall({ n, c }, false));
  if (store.me) {
    signed = true;
    vowName.textContent = store.me.n;
    vowCity.textContent = store.me.c;
    signBtn.textContent = "You're attached ✓";
    signBtn.disabled = true;
    dlBtn.disabled = shareBtn.disabled = false;
    addToWall(store.me, true);
  }
  renderCount();
  validate();
  redraw();
})();
