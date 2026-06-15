(function () {
  // Grab the full-viewport background canvas injected in index.html.
  // If the canvas is missing (e.g. on the contact/cookies pages) bail immediately.
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animId = null;      // requestAnimationFrame handle — null when stopped
  let particles = [];     // active particle objects for the current animation
  let W = 0, H = 0;       // canvas dimensions, kept in sync with the window
  let currentAnim = null; // name of the animation currently running

  // ── Helpers ────────────────────────────────────────────────────────────────
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

  // Resize the canvas pixel buffer to fill the window.
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // Cancel the animation loop, clear the canvas, and drop all particles.
  function stop() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    ctx.clearRect(0, 0, W, H);
    particles = [];
  }

  // Returns true when the dark theme is active (no data-theme attribute on <html>).
  function isDark() {
    return !document.documentElement.hasAttribute('data-theme');
  }

  // ── Rain ───────────────────────────────────────────────────────────────────
  // Creates a single raindrop particle. `opts` controls speed, length, opacity,
  // and angle so the same factory serves both light rain and the thunderstorm.
  function makeRainDrop(randomY, opts) {
    const speed = rand(opts.minSpeed, opts.maxSpeed);
    return {
      x: rand(0, W),
      y: randomY ? rand(-H, H) : rand(-(opts.maxLen), 0),  // randomY=true scatters drops across the screen on init
      speed,
      len: rand(opts.minLen, opts.maxLen),
      opacity: rand(opts.minOpacity, opts.maxOpacity),
      width: rand(opts.minWidth, opts.maxWidth),
      angle: opts.angle || 0
    };
  }

  // Generic rain loop. Each drop is a gradient line that fades from transparent
  // at the top to opaque at the tip, giving a motion-blur feel.
  function animateRain(opts) {
    stop();
    resize();
    const count = opts.count || 100;
    for (let i = 0; i < count; i++) particles.push(makeRainDrop(true, opts));

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const rgb = isDark() ? '142,197,255' : '26,111,196';
      const dx = Math.sin(opts.angle || 0) * 2;

      for (let i = 0; i < particles.length; i++) {
        const d = particles[i];
        const x2 = d.x + Math.sin(opts.angle || 0) * d.len;
        const y2 = d.y + d.len;
        const g = ctx.createLinearGradient(d.x, d.y, x2, y2);
        g.addColorStop(0, `rgba(${rgb},0)`);
        g.addColorStop(1, `rgba(${rgb},${d.opacity})`);
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = g;
        ctx.lineWidth = d.width;
        ctx.stroke();

        d.y += d.speed;
        d.x += dx;

        // Recycle drops that have left the visible area.
        if (d.y > H + opts.maxLen || d.x < -50 || d.x > W + 50) {
          particles[i] = makeRainDrop(false, opts);
          if (opts.angle) particles[i].x = rand(0, W + H * Math.abs(Math.tan(opts.angle || 0)));
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
  }

  // ── Snow ───────────────────────────────────────────────────────────────────
  function makeSnowFlake(randomY) {
    return {
      x: rand(0, W),
      y: randomY ? rand(-H, H) : rand(-20, 0),
      r: rand(1.5, 4.5),
      speed: rand(0.6, 2.2),
      drift: rand(-0.4, 0.4),       // gentle horizontal sway per frame
      opacity: rand(0.3, 0.8),
      wobble: rand(0, Math.PI * 2), // phase offset so flakes don't wobble in sync
      wobbleSpeed: rand(0.01, 0.04)
    };
  }

  function animateSnow() {
    stop();
    resize();
    for (let i = 0; i < 140; i++) particles.push(makeSnowFlake(true));

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const rgb = isDark() ? '220,235,255' : '100,140,200';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.wobble += p.wobbleSpeed;
        p.x += p.drift + Math.sin(p.wobble) * 0.4;  // sine wave gives a drifting path
        p.y += p.speed;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${p.opacity})`;
        ctx.fill();

        if (p.y > H + 10) particles[i] = makeSnowFlake(false);
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
  }

  // ── Clear / sunny — rising golden motes ────────────────────────────────────
  // Small floating dots that drift upwards and pulse in opacity, evoking dust
  // motes or heat shimmer on a sunny day.
  function makeMote(randomY) {
    return {
      x: rand(0, W),
      y: randomY ? rand(0, H) : H + rand(0, 20),
      r: rand(0.8, 2.8),
      speed: rand(0.3, 1.2),
      drift: rand(-0.3, 0.3),
      opacity: rand(0.15, 0.55),
      pulse: rand(0, Math.PI * 2),
      pulseSpeed: rand(0.01, 0.03)
    };
  }

  function animateClear() {
    stop();
    resize();
    for (let i = 0; i < 80; i++) particles.push(makeMote(true));

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const rgb = isDark() ? '255,220,100' : '220,150,20';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.pulse += p.pulseSpeed;
        p.x += p.drift;
        p.y -= p.speed;  // rise upwards
        const op = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${op})`;
        ctx.fill();

        if (p.y < -10) particles[i] = makeMote(false);
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
  }

  // ── Cloudy — shaped clouds rendered flat via offscreen canvas ─────────────
  // Draw to an offscreen canvas at full opacity, then blit at desired alpha.
  // This prevents overlapping shapes from darkening each other.
  function buildCloudCanvas(w) {
    const h = Math.ceil(w * 0.62);
    const off = document.createElement('canvas');
    off.width  = Math.ceil(w) + 4;
    off.height = h + 4;
    const c = off.getContext('2d');
    const col = isDark() ? '#a8b8cc' : '#7a8ea8';
    c.fillStyle = col;

    function circle(cx, cy, r) {
      c.beginPath();
      c.arc(cx + 2, cy + 2, r, 0, Math.PI * 2);
      c.fill();
    }

    // Wide flat base ellipse
    c.beginPath();
    c.ellipse(w * 0.5 + 2, h * 0.74 + 2, w * 0.46, h * 0.30, 0, 0, Math.PI * 2);
    c.fill();

    // Large left dome
    circle(w * 0.31, h * 0.42, w * 0.23);

    // Medium right dome
    circle(w * 0.61, h * 0.53, w * 0.18);

    // Small far-right bump
    circle(w * 0.82, h * 0.68, w * 0.11);

    return off;
  }

  function makeCloud(randomX, slotY) {
    const w = rand(220, 400);
    return {
      x: randomX ? rand(-w, W + w * 0.5) : -(w + rand(10, 80)),
      y: slotY !== undefined ? slotY : rand(0, H * 0.85),
      w,
      h: Math.ceil(w * 0.62) + 4,
      speed: rand(0.1, 0.35),
      opacity: rand(0.10, 0.24),
      offscreen: null  // built lazily on first draw and rebuilt when theme changes
    };
  }

  function animateCloudy() {
    stop();
    resize();
    // Spread 6 clouds across evenly-spaced vertical slots so they don't bunch up
    const count = 6;
    for (let i = 0; i < count; i++) {
      const slotY = (H / count) * i + rand(0, H / count * 0.8);
      particles.push(makeCloud(true, slotY));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speed;

        // Build offscreen canvas on first use (or after theme change)
        if (!p.offscreen) p.offscreen = buildCloudCanvas(p.w);

        ctx.globalAlpha = p.opacity;
        ctx.drawImage(p.offscreen, p.x, p.y);
        ctx.globalAlpha = 1;

        if (p.x > W + p.w + 20) {
          particles[i] = makeCloud(false, rand(0, H * 0.85));
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
  }

  // ── Fog — horizontal wisps ─────────────────────────────────────────────────
  // Large semi-transparent radial-gradient ellipses that drift slowly rightward.
  function makeFogWisp(randomX, slotY) {
    return {
      x: randomX ? rand(-600, W) : -rand(300, 700),
      y: slotY !== undefined ? slotY : rand(0, H),
      w: rand(500, 900),
      h: rand(130, 260),
      speed: rand(0.15, 0.5),
      opacity: rand(0.05, 0.14)
    };
  }

  function animateFog() {
    stop();
    resize();
    // Slot wisps evenly across the full screen height
    const count = 8;
    for (let i = 0; i < count; i++) {
      const slotY = (H / count) * i + rand(0, H / count * 0.7);
      particles.push(makeFogWisp(true, slotY));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const rgb = isDark() ? '180,185,195' : '100,110,125';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speed;

        // Radial gradient fades the wisp to transparent at its edges.
        const g = ctx.createRadialGradient(
          p.x + p.w / 2, p.y, 0,
          p.x + p.w / 2, p.y, p.w / 2
        );
        g.addColorStop(0, `rgba(${rgb},${p.opacity})`);
        g.addColorStop(1, `rgba(${rgb},0)`);

        ctx.beginPath();
        ctx.ellipse(p.x + p.w / 2, p.y, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        if (p.x > W + 50) particles[i] = makeFogWisp(false, rand(0, H));
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
  }

  // ── Lightning bolt drawing ─────────────────────────────────────────────────
  // Generates a jagged polyline from a point near the top of the screen to
  // somewhere in the lower half, with an optional branch.
  function makeBolt(x, startY) {
    const segments = [];
    let cx = x, cy = startY;
    const targetY = H * rand(0.4, 0.85);
    const steps = randInt(6, 12);
    const stepH = (targetY - startY) / steps;
    segments.push({ x: cx, y: cy });
    for (let i = 0; i < steps; i++) {
      cx += rand(-60, 60);
      cy += stepH + rand(-10, 10);
      segments.push({ x: cx, y: cy });
    }
    return { segments, opacity: 1, life: 1, hasBranch: Math.random() < 0.5 };
  }

  // Draws a bolt with a wide glow pass and a thin bright core pass.
  function drawBolt(bolt) {
    if (bolt.opacity <= 0) return;
    const glow = isDark() ? '200,220,255' : '150,180,255';
    const core = isDark() ? '255,255,255' : '220,240,255';
    const segs = bolt.segments;

    // Glow
    ctx.beginPath();
    ctx.moveTo(segs[0].x, segs[0].y);
    for (let i = 1; i < segs.length; i++) ctx.lineTo(segs[i].x, segs[i].y);
    ctx.strokeStyle = `rgba(${glow},${bolt.opacity * 0.3})`;
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Core
    ctx.beginPath();
    ctx.moveTo(segs[0].x, segs[0].y);
    for (let i = 1; i < segs.length; i++) ctx.lineTo(segs[i].x, segs[i].y);
    ctx.strokeStyle = `rgba(${core},${bolt.opacity})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Branch — an optional secondary bolt splitting off mid-way.
    if (bolt.hasBranch && segs.length > 3) {
      const branchFrom = randInt(1, segs.length - 2);
      ctx.beginPath();
      ctx.moveTo(segs[branchFrom].x, segs[branchFrom].y);
      let bx = segs[branchFrom].x, by = segs[branchFrom].y;
      const bSteps = randInt(3, 5);
      for (let i = 0; i < bSteps; i++) {
        bx += rand(-40, 40);
        by += rand(20, 50);
        ctx.lineTo(bx, by);
      }
      ctx.strokeStyle = `rgba(${core},${bolt.opacity * 0.6})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  // ── Thunderstorm — heavy rain + lightning bolts + flashes ─────────────────
  let flashOpacity = 0;
  let lastFlashTime = 0;
  let nextFlashIn = rand(3000, 8000);
  let bolts = [];

  // Creates a lightning strike: screen flash, bolt(s), optional double-flash.
  function triggerLightning(now) {
    lastFlashTime = now;
    nextFlashIn = rand(2500, 9000);
    flashOpacity = rand(0.12, 0.28);
    bolts = [];
    const boltCount = Math.random() < 0.35 ? 2 : 1;
    for (let i = 0; i < boltCount; i++) {
      bolts.push(makeBolt(rand(W * 0.1, W * 0.9), rand(-20, H * 0.1)));
    }
    // Double flash — a brief second flash 100ms after the first.
    if (Math.random() < 0.4) {
      setTimeout(function () { flashOpacity = rand(0.05, 0.15); }, 100);
      setTimeout(function () { flashOpacity = 0; }, 200);
    }
  }

  function animateStorm() {
    stop();
    resize();
    lastFlashTime = performance.now();
    bolts = [];
    flashOpacity = 0;

    const rainOpts = {
      count: 200, minSpeed: 14, maxSpeed: 22,
      minLen: 18, maxLen: 35, minOpacity: 0.15, maxOpacity: 0.55,
      minWidth: 0.5, maxWidth: 1.5, angle: 0.18  // slight diagonal for stormy feel
    };
    for (let i = 0; i < rainOpts.count; i++) particles.push(makeRainDrop(true, rainOpts));

    const rgb = isDark() ? '142,197,255' : '26,111,196';

    function draw(now) {
      ctx.clearRect(0, 0, W, H);

      // Trigger lightning when the timer expires.
      if (now - lastFlashTime > nextFlashIn) triggerLightning(now);

      // Flash overlay — exponential decay fades the screen-wide white flash.
      if (flashOpacity > 0) {
        ctx.fillStyle = `rgba(200,215,255,${flashOpacity})`;
        ctx.fillRect(0, 0, W, H);
        flashOpacity *= 0.80;
        if (flashOpacity < 0.004) flashOpacity = 0;
      }

      // Fade out and remove spent bolts.
      for (let i = bolts.length - 1; i >= 0; i--) {
        drawBolt(bolts[i]);
        bolts[i].opacity *= 0.75;
        if (bolts[i].opacity < 0.02) bolts.splice(i, 1);
      }

      // Heavy angled rain (reuses the rain particle system).
      const dx = Math.sin(rainOpts.angle) * 2;
      for (let i = 0; i < particles.length; i++) {
        const d = particles[i];
        const x2 = d.x + Math.sin(rainOpts.angle) * d.len;
        const y2 = d.y + d.len;
        const g = ctx.createLinearGradient(d.x, d.y, x2, y2);
        g.addColorStop(0, `rgba(${rgb},0)`);
        g.addColorStop(1, `rgba(${rgb},${d.opacity})`);
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = g;
        ctx.lineWidth = d.width;
        ctx.stroke();
        d.y += d.speed;
        d.x += dx;
        if (d.y > H + rainOpts.maxLen || d.x < -50 || d.x > W + 50) {
          particles[i] = makeRainDrop(false, rainOpts);
          particles[i].x = rand(0, W + H * Math.abs(Math.tan(rainOpts.angle)));
        }
      }

      animId = requestAnimationFrame(draw);
    }
    animId = requestAnimationFrame(draw);
  }

  // ── WMO code → animation ──────────────────────────────────────────────────
  // Maps World Meteorological Organization weather codes (from the Open-Meteo
  // API) to one of the six animation names.
  function pickAnimation(code) {
    if (code === 0 || code === 1) return 'clear';
    if (code === 2 || code === 3) return 'cloudy';
    if (code === 45 || code === 48) return 'fog';
    if (code >= 51 && code <= 57) return 'drizzle';
    if (code >= 61 && code <= 67) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code === 85 || code === 86) return 'snow';
    if (code >= 95) return 'storm';
    return 'clear';
  }

  // Starts the named animation, skipping if it's already running.
  function runAnimation(name) {
    if (name === currentAnim) return;
    currentAnim = name;
    switch (name) {
      case 'rain':
        animateRain({ count: 120, minSpeed: 6, maxSpeed: 14, minLen: 12, maxLen: 28, minOpacity: 0.1, maxOpacity: 0.45, minWidth: 0.5, maxWidth: 1.5 });
        break;
      case 'drizzle':
        animateRain({ count: 35, minSpeed: 2, maxSpeed: 5, minLen: 8, maxLen: 16, minOpacity: 0.18, maxOpacity: 0.45, minWidth: 0.5, maxWidth: 0.9 });
        break;
      case 'snow':    animateSnow();   break;
      case 'storm':   animateStorm();  break;
      case 'cloudy':  animateCloudy(); break;
      case 'fog':     animateFog();    break;
      case 'clear':
      default:        animateClear();  break;
    }
  }

  // ── Weather fetch ──────────────────────────────────────────────────────────
  // Fetches the current weather code for a lat/lon from Open-Meteo (free, no key).
  async function fetchWeather(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code&timezone=auto&forecast_days=1`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.current?.weather_code ?? null;
    } catch { return null; }
  }

  // Geolocates the visitor via IP APIs, fetches weather for their coordinates,
  // picks the matching animation, and caches it to localStorage for 30 minutes.
  async function detectAndAnimate() {
    const endpoints = [
      'https://ipwho.is/?fields=success,latitude,longitude',
      'https://ipinfo.io/json'
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        let lat, lon;
        if (data.latitude && data.longitude) {
          lat = data.latitude; lon = data.longitude;
        } else if (data.loc) {
          [lat, lon] = data.loc.split(',').map(Number);
        }
        if (lat == null || lon == null) continue;

        const code = await fetchWeather(lat, lon);
        if (code !== null) {
          const anim = pickAnimation(code);
          try {
            localStorage.setItem(ANIM_LAST_KEY, anim);
            localStorage.setItem(ANIM_LAST_TS_KEY, String(Date.now()));
          } catch {}
          runAnimation(anim);
          return;
        }
      } catch {}
    }
    // No weather data — keep default
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  const ANIM_ENABLED_KEY  = 'gekkzzz-anim-enabled';
  const ANIM_LAST_KEY     = 'gekkzzz-anim-last';
  const ANIM_LAST_TS_KEY  = 'gekkzzz-anim-last-ts';
  const ANIM_CACHE_TTL    = 30 * 60 * 1000; // reuse cached weather for 30 minutes
  let animEnabled = true;

  function loadAnimEnabled() {
    try {
      const v = localStorage.getItem(ANIM_ENABLED_KEY);
      return v === null ? true : v === 'true';
    } catch { return true; }
  }

  function saveAnimEnabled(val) {
    try { localStorage.setItem(ANIM_ENABLED_KEY, String(val)); } catch {}
  }

  function enableAnimations() {
    animEnabled = true;
    saveAnimEnabled(true);
    canvas.style.display = '';
    const toRun = currentAnim || 'clear';
    currentAnim = null; // force restart even if same animation
    runAnimation(toRun);
    updateToggleBtn();
  }

  function disableAnimations() {
    animEnabled = false;
    saveAnimEnabled(false);
    stop();
    canvas.style.display = 'none';
    updateToggleBtn();
  }

  // Keeps the "anim: on/off" nav button in sync with the current state.
  function updateToggleBtn() {
    const btn = document.getElementById('anim-toggle-btn');
    if (!btn) return;
    btn.textContent = animEnabled ? 'anim: on' : 'anim: off';
    btn.classList.toggle('active', animEnabled);
  }

  // Start disabled if the user has requested reduced motion at the OS level.
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReduced.matches) {
    // Still expose API but start disabled
    animEnabled = false;
  }

  // Track OS setting changes at runtime so toggling "Reduce Motion" takes effect immediately.
  prefersReduced.addEventListener('change', function (e) {
    if (e.matches) disableAnimations();
    else if (loadAnimEnabled()) enableAnimations();
  });

  // Restart the animation at the new size when the window is resized.
  window.addEventListener('resize', function () {
    if (!animEnabled) return;
    resize();
    if (currentAnim) { const a = currentAnim; currentAnim = null; runAnimation(a); }
  });

  // When the theme toggles, invalidate cached offscreen cloud canvases so they
  // rebuild with the correct colour, then restart the animation.
  new MutationObserver(function () {
    if (!animEnabled) return;
    // Invalidate cached offscreen cloud canvases so they rebuild with the new theme colour
    particles.forEach(function (p) { if (p && p.offscreen) p.offscreen = null; });
    if (currentAnim) { const a = currentAnim; currentAnim = null; runAnimation(a); }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Public API — exposed on window so the nav toggle button (wired below) and
  // any inline scripts can call animApi.enable(), .disable(), .toggle(), etc.
  window.animApi = {
    run: function (name) { if (animEnabled) runAnimation(name); },
    enable: enableAnimations,
    disable: disableAnimations,
    toggle: function () { animEnabled ? disableAnimations() : enableAnimations(); },
    isEnabled: function () { return animEnabled; },
    updateToggleBtn: updateToggleBtn
  };

  // Boot — decide which animation to start and whether to fetch fresh weather.
  resize();
  animEnabled = loadAnimEnabled() && !prefersReduced.matches;
  if (animEnabled) {
    let startAnim = 'clear';
    let cacheValid = false;
    try {
      // Use the cached animation if it's less than 30 minutes old.
      const last = localStorage.getItem(ANIM_LAST_KEY);
      const ts = parseInt(localStorage.getItem(ANIM_LAST_TS_KEY) || '0', 10);
      if (last && Date.now() - ts < ANIM_CACHE_TTL) {
        startAnim = last;
        cacheValid = true;
      }
    } catch {}
    runAnimation(startAnim);
    detectAndAnimate();  // always fetch real weather in the background; cache only picks the starting animation
  } else {
    canvas.style.display = 'none';
  }

  // Wire toggle button if already in DOM
  document.addEventListener('DOMContentLoaded', function () {
    updateToggleBtn();
    const btn = document.getElementById('anim-toggle-btn');
    if (btn) btn.addEventListener('click', function () { window.animApi.toggle(); });
  });
})();
