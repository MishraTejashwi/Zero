(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = {
    mouseX: innerWidth / 2,
    mouseY: innerHeight / 2,
    smoothX: innerWidth / 2,
    smoothY: innerHeight / 2,
    prevX: innerWidth / 2,
    prevY: innerHeight / 2,
    velocity: 0,
    scrollY: scrollY,
    smoothScroll: scrollY,
    debug: false,
    sound: false,
    logoClicks: 0,
  };

  const cursor = $('#cursor');
  const cursorDot = $('#cursorDot');
  const spotlight = $('#spotlight');
  const coordX = $('#coordX');
  const coordY = $('#coordY');
  const fx = $('#fx');
  const ctx = fx.getContext('2d');
  let dpr = Math.min(devicePixelRatio || 1, 2);
  const particles = [];
  const ripples = [];

  function resizeCanvas() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    fx.width = innerWidth * dpr;
    fx.height = innerHeight * dpr;
    fx.style.width = innerWidth + 'px';
    fx.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  addEventListener('resize', resizeCanvas);

  function spawnTrail(x, y, intensity = 1) {
    if (reduceMotion) return;
    const count = Math.min(4, Math.ceil(intensity * 2));
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - .5) * 1.4,
        vy: (Math.random() - .5) * 1.4,
        life: 1,
        size: Math.random() * 1.7 + .4,
      });
    }
    if (particles.length > 180) particles.splice(0, particles.length - 180);
  }

  function drawFx() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= .025;
      p.vx *= .985;
      p.vy *= .985;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life * .5;
      ctx.fillStyle = '#b89aff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += 6.5;
      r.life -= .035;
      if (r.life <= 0) { ripples.splice(i, 1); continue; }
      ctx.globalAlpha = r.life * .5;
      ctx.strokeStyle = '#a980ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  addEventListener('pointermove', e => {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
    const dx = e.clientX - state.prevX;
    const dy = e.clientY - state.prevY;
    state.velocity = Math.min(45, Math.hypot(dx, dy));
    state.prevX = e.clientX;
    state.prevY = e.clientY;
    document.documentElement.style.setProperty('--mx', e.clientX + 'px');
    document.documentElement.style.setProperty('--my', e.clientY + 'px');
    coordX && (coordX.textContent = `X ${String(Math.round(e.clientX)).padStart(4, '0')}`);
    coordY && (coordY.textContent = `Y ${String(Math.round(e.clientY)).padStart(4, '0')}`);
    spawnTrail(e.clientX, e.clientY, state.velocity / 18);
  }, { passive: true });

  addEventListener('pointerdown', e => {
    ripples.push({ x: e.clientX, y: e.clientY, radius: 6, life: 1 });
    clickTone();
  });

  $$('a,button,input,select').forEach(el => {
    el.addEventListener('pointerenter', () => cursor?.classList.add('active'));
    el.addEventListener('pointerleave', () => cursor?.classList.remove('active'));
  });

  function updatePointer() {
    state.smoothX = lerp(state.smoothX, state.mouseX, .14);
    state.smoothY = lerp(state.smoothY, state.mouseY, .14);
    if (cursor) cursor.style.transform = `translate3d(${state.smoothX - cursor.offsetWidth / 2}px,${state.smoothY - cursor.offsetHeight / 2}px,0) rotate(${state.velocity * .6}deg)`;
    if (cursorDot) cursorDot.style.transform = `translate3d(${state.mouseX - 2}px,${state.mouseY - 2}px,0)`;
    if (spotlight) spotlight.style.transform = `translate(-50%,-50%) scale(${1 + state.velocity / 180})`;
    state.velocity *= .92;
  }

  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      if (innerWidth < 900 || reduceMotion) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * .16}px, ${y * .16}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  $$('.tilt-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (innerWidth < 900 || reduceMotion) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      const max = Number(card.dataset.tilt || 8);
      card.style.transform = `translateY(-50%) perspective(700px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = 'translateY(-50%)');
  });

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: .14 });
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 5, 4) * 70}ms`;
    revealObs.observe(el);
  });

  const sections = $$('.section');
  function applyScrollCinematics() {
    state.scrollY = scrollY;
    state.smoothScroll = lerp(state.smoothScroll, state.scrollY, .075);
    const vh = innerHeight;

    sections.forEach(section => {
      const r = section.getBoundingClientRect();
      const center = r.top + r.height / 2 - vh / 2;
      const proximity = clamp(1 - Math.abs(center) / (vh * 1.25), 0, 1);
      section.style.setProperty('--section-focus', proximity.toFixed(3));
    });

    const hero = $('#hero');
    if (hero) {
      const hr = hero.getBoundingClientRect();
      const p = clamp(-hr.top / Math.max(hr.height, 1), 0, 1);
      const content = $('.hero__content');
      const modulePanel = $('.module-panel');
      const demoPanel = $('.demo-panel');
      const depth = $('.hero__depth');
      if (content && !reduceMotion) content.style.transform = `translate(-50%, calc(-50% + ${p * -34}px)) scale(${1 - p * .12})`;
      if (modulePanel && !reduceMotion) modulePanel.style.marginLeft = `${-p * 48}px`;
      if (demoPanel && !reduceMotion) demoPanel.style.marginRight = `${-p * 48}px`;
      if (depth && !reduceMotion) depth.style.transform = `scale(${1 + p * .5}) translateY(${p * 30}px)`;
    }

    $$('[data-parallax]').forEach(el => {
      if (reduceMotion) return;
      const speed = Number(el.dataset.parallax || 0);
      const r = el.closest('.section')?.getBoundingClientRect();
      if (!r) return;
      el.style.translate = `0 ${r.top * speed}px`;
    });

    const arch = $('#architectureStage');
    if (arch && !reduceMotion) {
      const r = arch.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      arch.style.setProperty('--arch-progress', p);
      arch.style.transform = `perspective(1200px) rotateX(${(p - .5) * -3}deg) scale(${.97 + p * .03})`;
    }

    const stack = $('#componentStack');
    if (stack && !reduceMotion) {
      const r = stack.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      $$('.component-card', stack).forEach((card, i) => {
        const spread = (i - 1) * 12 * (1 - p);
        card.style.translate = `${spread}px ${Math.abs(i - 1) * 18 * (1 - p)}px`;
      });
    }
  }

  $$('[data-scroll]').forEach(btn => btn.addEventListener('click', () => {
    const target = $(btn.dataset.scroll);
    target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  const archCopy = {
    core: ['Framework Kernel', 'The orchestration layer keeps modules independent while exposing a predictable interface to the game.'],
    navigation: ['Navigation', 'Focus graphs, route changes, controller intent and back-stack behavior live here instead of leaking into every screen.'],
    state: ['Reactive State', 'Shared UI state remains explicit and observable, so screens react to data rather than repeatedly polling gameplay objects.'],
    widgets: ['Reusable Widgets', 'Views expose small contracts and reusable states, keeping project-specific logic outside the presentation layer.'],
    events: ['Event Routing', 'Signals travel through deliberate event paths, reducing hard references and keeping feature modules loosely coupled.'],
  };
  const archDetail = $('#archDetail');
  $$('.arch-node').forEach(node => {
    node.addEventListener('pointerenter', () => {
      $$('.arch-node').forEach(n => n.classList.toggle('dimmed', n !== node));
      node.classList.add('active');
      const [title, copy] = archCopy[node.dataset.node];
      if (archDetail) archDetail.innerHTML = `<small>INSPECTING / ${node.dataset.node.toUpperCase()}</small><h3>${title}</h3><p>${copy}</p>`;
    });
    node.addEventListener('pointerleave', () => {
      $$('.arch-node').forEach(n => n.classList.remove('dimmed', 'active'));
    });
  });

  const heroTitle = $('.hero__title');
  const originalTitle = 'SCALABLE UI';
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@';
  let scrambleRAF;
  function scrambleTitle(label = originalTitle) {
    if (!heroTitle) return;
    cancelAnimationFrame(scrambleRAF);
    let frame = 0;
    const duration = 18;
    const run = () => {
      const progress = frame / duration;
      heroTitle.textContent = label.split('').map((ch, i) => {
        if (ch === ' ') return ' ';
        if (i / label.length < progress) return ch;
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      }).join('');
      frame++;
      if (frame <= duration) scrambleRAF = requestAnimationFrame(run);
      else heroTitle.textContent = label;
    };
    run();
  }
  $$('.module-row').forEach(row => {
    row.addEventListener('pointerenter', () => {
      $$('.module-row').forEach(r => r.classList.remove('active'));
      row.classList.add('active');
      scrambleTitle(originalTitle);
    });
  });

  const intensity = $('#intensity');
  const scale = $('#scale');
  const motionSelect = $('#motionSelect');
  const pulseToggle = $('#pulseToggle');
  const previewObject = $('#previewObject');
  const intensityValue = $('#intensityValue');
  const scaleValue = $('#scaleValue');

  function applyLab() {
    const i = Number(intensity?.value || 72);
    const s = Number(scale?.value || 106) / 100;
    document.documentElement.style.setProperty('--lab-intensity', i);
    document.documentElement.style.setProperty('--lab-scale', s);
    intensityValue && (intensityValue.textContent = i);
    scaleValue && (scaleValue.textContent = s.toFixed(2));
    const demo = $('.lab-demo-button', previewObject || document);
    if (demo) {
      demo.dataset.motion = motionSelect?.value || 'spring';
      demo.classList.toggle('pulse-enabled', !!pulseToggle?.checked);
    }
  }
  [intensity, scale, motionSelect, pulseToggle].forEach(el => el?.addEventListener('input', applyLab));
  applyLab();

  const labMarkup = {
    button: '<button class="lab-demo-button pulse-enabled"><span>LAUNCH SYSTEM</span><i>↗</i></button>',
    modal: '<div class="lab-modal"><small>SYSTEM PROMPT / 01</small><strong>Apply interface state?</strong><p>This preview is generated from the same component rules.</p><div><button>Cancel</button><button>Apply ↗</button></div></div>',
    hud: '<div class="lab-hud"><div><span>ENERGY</span><b>84</b></div><i></i><div><span>MODULES</span><b>06</b></div><i></i><div><span>STATE</span><b>LIVE</b></div></div>',
  };
  $$('.lab-item').forEach(item => item.addEventListener('click', () => {
    $$('.lab-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    if (!previewObject) return;
    previewObject.classList.remove('object-enter');
    void previewObject.offsetWidth;
    previewObject.innerHTML = labMarkup[item.dataset.component];
    previewObject.classList.add('object-enter');
    applyLab();
  }));
  $('#replayMotion')?.addEventListener('click', () => {
    if (!previewObject) return;
    previewObject.classList.remove('object-enter');
    void previewObject.offsetWidth;
    previewObject.classList.add('object-enter');
  });

  const commandOverlay = $('#commandOverlay');
  const commandInput = $('#commandInput');
  const debugGrid = $('#debugGrid');
  function openCommand() {
    commandOverlay?.classList.add('open');
    commandOverlay?.setAttribute('aria-hidden', 'false');
    setTimeout(() => commandInput?.focus(), 20);
  }
  function closeCommand() {
    commandOverlay?.classList.remove('open');
    commandOverlay?.setAttribute('aria-hidden', 'true');
    commandInput?.blur();
  }
  function toggleDebug(force) {
    state.debug = typeof force === 'boolean' ? force : !state.debug;
    debugGrid?.classList.toggle('active', state.debug);
    $('#debugToggle')?.setAttribute('aria-pressed', String(state.debug));
    const b = $('#debugToggle b'); if (b) b.textContent = state.debug ? 'ON' : 'OFF';
    document.body.classList.toggle('debug-mode', state.debug);
  }
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCommand(); }
    if (e.key === 'Escape') closeCommand();
  });
  commandOverlay?.addEventListener('pointerdown', e => { if (e.target === commandOverlay) closeCommand(); });
  $$('.command-list button').forEach(btn => btn.addEventListener('click', () => {
    const cmd = btn.dataset.command;
    if (cmd === 'debug') toggleDebug();
    else $('#' + cmd)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    closeCommand();
  }));
  commandInput?.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = commandInput.value.trim().toLowerCase();
    if (q.includes('debug')) toggleDebug();
    else if (q.includes('arch')) $('#architecture')?.scrollIntoView({ behavior: 'smooth' });
    else if (q.includes('comp')) $('#components')?.scrollIntoView({ behavior: 'smooth' });
    else if (q.includes('lab')) $('#lab')?.scrollIntoView({ behavior: 'smooth' });
    closeCommand();
  });
  $('#debugToggle')?.addEventListener('click', () => toggleDebug());
  $('.brand')?.addEventListener('click', () => {
    state.logoClicks++;
    clearTimeout(state.logoReset);
    state.logoReset = setTimeout(() => state.logoClicks = 0, 1800);
    if (state.logoClicks >= 5) {
      toggleDebug(true);
      openCommand();
      state.logoClicks = 0;
    }
  });

  let audioCtx;
  function tone(freq = 420, duration = .05, volume = .025) {
    if (!state.sound) return;
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function clickTone() { tone(560 + state.velocity * 3, .04, .018); }
  $('#soundToggle')?.addEventListener('click', async () => {
    state.sound = !state.sound;
    const btn = $('#soundToggle');
    btn?.setAttribute('aria-pressed', String(state.sound));
    const label = $('#soundToggle b'); if (label) label.textContent = state.sound ? 'ON' : 'OFF';
    if (state.sound) { audioCtx ||= new (window.AudioContext || window.webkitAudioContext)(); await audioCtx.resume(); tone(680, .09, .03); }
  });
  $$('button,a').forEach(el => el.addEventListener('pointerenter', () => tone(390, .025, .009)));

  function updateClock() {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const parts = fmt.format(now).replaceAll(':', ' : ');
    const clock = $('#clock'); if (clock) clock.textContent = parts;
  }
  updateClock(); setInterval(updateClock, 1000);

  const boot = $('#boot');
  const bootLine = $('#bootLine');
  const bootStatus = $('#bootStatus');
  const bootSteps = [
    ['Mounting UI kernel...', 24],
    ['Registering modules...', 52],
    ['Binding interaction graph...', 78],
    ['Interface ready.', 100],
  ];
  let step = 0;
  function nextBootStep() {
    if (!boot) return;
    if (step >= bootSteps.length) {
      setTimeout(() => {
        boot.classList.add('hidden');
        document.body.classList.add('system-ready');
        scrambleTitle();
      }, 300);
      return;
    }
    const [text, width] = bootSteps[step++];
    bootStatus.textContent = text;
    bootLine.style.width = width + '%';
    setTimeout(nextBootStep, reduceMotion ? 40 : 330);
  }
  setTimeout(nextBootStep, 120);

  function frame() {
    updatePointer();
    drawFx();
    applyScrollCinematics();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
