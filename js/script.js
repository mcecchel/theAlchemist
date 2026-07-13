/* =============================================================================
   MARIANNA CECCHELLI — script condiviso
   A. utilità (anno, reveal)
   B. DUALITÀ: profilo Designer / Developer (palette, copy, ordine, filtri)
   C. particelle reattive al mouse  — identiche alla tua versione
   D. roll 3D della cover           — identico alla tua versione
   E. filtri portfolio + menu mobile
   ============================================================================= */

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- A. Utilità ---------------------------------------------------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));


/* =============================================================================
   B. DUALITÀ — un solo stato ('design' | 'dev' | null), quattro conseguenze:
      1. la palette si ribalta   (--dom / --sub nel CSS)
      2. il copy cambia lente     (data-both / data-design / data-dev)
      3. progetti, servizi e competenze si riordinano (l'altra anima resta visibile)
      4. il portfolio pre-seleziona il filtro coerente
   Nessuna scelta = null: il gate d'ingresso (.lens-gate, css) resta in primo
   piano e nasconde il resto del sito finché non si sceglie design o dev.
   ============================================================================= */
const root = document.documentElement;
const sweep = document.querySelector('.lens-sweep');
const lensNameEl = document.getElementById('lens-name');
const LENS_LABEL = { design: 'Designer', dev: 'Developer' };
const LENS_FILTER = { design: 'brand', dev: 'web' };

let lens = null;

function readStoredLens() {
  const fromUrl = new URLSearchParams(location.search).get('lens');
  if (fromUrl === 'design' || fromUrl === 'dev') return fromUrl;
  try {
    const saved = sessionStorage.getItem('mc-lens');
    if (saved === 'design' || saved === 'dev') return saved;
  } catch (e) { /* storage non disponibile: nessun problema */ }
  return null;
}

function storeLens(value) {
  try {
    if (value) sessionStorage.setItem('mc-lens', value);
    else sessionStorage.removeItem('mc-lens');
  } catch (e) { /* ignora */ }
}

/* stesso contenuto, altra angolazione: ogni elemento porta le sue tre versioni */
function applyCopy() {
  document.querySelectorAll('[data-both]').forEach((el) => {
    const text = (lens && el.dataset[lens]) || el.dataset.both;
    if (text) el.innerHTML = text;
  });
}

/* il profilo scelto viaggia con te tra le pagine */
function propagateLens() {
  document.querySelectorAll('a[href$=".html"]').forEach((a) => {
    const url = new URL(a.getAttribute('href'), location.href);
    if (lens) url.searchParams.set('lens', lens);
    else url.searchParams.delete('lens');
    a.setAttribute('href', url.pathname.split('/').pop() + url.search);
  });
}

function setLens(next, { animate = true } = {}) {
  lens = next;

  if (lens) root.setAttribute('data-lens', lens);
  else root.removeAttribute('data-lens');

  storeLens(lens);
  applyCopy();
  propagateLens();

  if (lensNameEl && lens) lensNameEl.textContent = LENS_LABEL[lens];

  document.querySelectorAll('[data-set-lens]').forEach((btn) => {
    if (btn.hasAttribute('aria-pressed')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.setLens === lens));
    }
  });

  applyLensToFilters();

  if (animate && !reducedMotion && sweep) {
    sweep.classList.remove('is-running');
    void sweep.offsetWidth; // riavvia l'animazione
    sweep.classList.add('is-running');
  }
}

document.querySelectorAll('[data-set-lens]').forEach((btn) => {
  btn.addEventListener('click', () => setLens(btn.dataset.setLens));
});

const lensSwap = document.getElementById('lens-swap');
if (lensSwap) lensSwap.addEventListener('click', () => setLens(lens === 'dev' ? 'design' : 'dev'));


/* =============================================================================
   C. Particelle reattive al mouse (canvas nativo, no lib)
   ============================================================================= */
const coverWelcome = document.getElementById('cover-welcome');

const PARTICLE_COLORS = ['#3c85ff', '#c540b6'];

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function clamp01(v) {
  return Math.min(Math.max(v, 0), 1);
}

// sprite di glow pre-renderizzati (condivisi tra tutti i campi di particelle):
// costa carissimo ricalcolare shadowBlur per ogni particella a ogni frame
// (causava scatti), meglio un drawImage
const GLOW_SIZE = 48;
const glowSprites = {};
PARTICLE_COLORS.forEach((color) => {
  const c = document.createElement('canvas');
  c.width = GLOW_SIZE;
  c.height = GLOW_SIZE;
  const gctx = c.getContext('2d');
  const grad = gctx.createRadialGradient(
    GLOW_SIZE / 2, GLOW_SIZE / 2, 0,
    GLOW_SIZE / 2, GLOW_SIZE / 2, GLOW_SIZE / 2
  );
  grad.addColorStop(0, color);
  grad.addColorStop(0.3, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
  glowSprites[color] = c;
});

// campo di particelle riusabile: galleggiano a caso, reagiscono al mouse.
// con withIntro true fa anche la timeline di apertura (appear casuale ->
// fade testo -> cerchio -> espansione radiale -> rilascio al galleggiamento)
function createParticleField(canvas, { count, withIntro = false, coverEl = null }) {
  if (!canvas || reducedMotion) return;
  const ctx = canvas.getContext('2d');
  const mouse = { x: null, y: null, radius: 110 };

  const APPEAR_WINDOW = 1200;
  const APPEAR_MIN_DUR = 250;
  const APPEAR_MAX_DUR = 550;
  const TEXT_DELAY = APPEAR_WINDOW + 200;
  const TEXT_DURATION = 900;
  const CIRCLE_DELAY = TEXT_DELAY + TEXT_DURATION + 300;
  const CIRCLE_FORM_DURATION = 1300;
  const EXPAND_START = CIRCLE_DELAY + CIRCLE_FORM_DURATION;
  const EXPAND_DURATION = 1800;
  const SIMPLE_FADE_DURATION = 900; // fade-in per i campi senza intro

  let w, h, particles;
  const startTime = performance.now();

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }

  function makeParticles() {
    particles = Array.from({ length: count }, (_, i) => {
      const homeX = Math.random() * w;
      const homeY = Math.random() * h;
      return {
        x: homeX,
        y: homeY,
        baseX: homeX,
        baseY: homeY,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        floatSeed: Math.random() * Math.PI * 2,
        r: Math.random() * 2.6 + 1.8,
        alpha: Math.random() * 0.15 + 0.6,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        angle: (i / count) * Math.PI * 2,
        appearDelay: withIntro ? Math.random() * APPEAR_WINDOW : Math.random() * 400,
        appearDuration: withIntro
          ? APPEAR_MIN_DUR + Math.random() * (APPEAR_MAX_DUR - APPEAR_MIN_DUR)
          : SIMPLE_FADE_DURATION,
        released: !withIntro,
      };
    });
  }

  function step(now) {
    ctx.clearRect(0, 0, w, h);
    const elapsed = now - startTime;

    let circleFormEased = 0;
    let expandRaw = 1;
    let expandEased = 1;
    let cx = 0, cy = 0, baseRadius = 0, maxRadius = 0;

    if (withIntro) {
      const textT = clamp01((elapsed - TEXT_DELAY) / TEXT_DURATION);
      const textEased = easeInOutCubic(textT);
      if (coverEl) {
        coverEl.style.opacity = String(textEased);
        coverEl.style.filter = `blur(${(1 - textEased) * 12}px)`;
        coverEl.style.transform = `scale(${1 + (1 - textEased) * 0.06})`;
      }
      circleFormEased = easeInOutCubic(clamp01((elapsed - CIRCLE_DELAY) / CIRCLE_FORM_DURATION));
      expandRaw = clamp01((elapsed - EXPAND_START) / EXPAND_DURATION);
      expandEased = easeOutCubic(expandRaw);
      cx = w / 2;
      cy = h / 2;
      baseRadius = Math.min(w, h) * 0.05;
      maxRadius = Math.min(w, h) * 0.48;
    }

    particles.forEach((p) => {
      p.baseX += p.vx + Math.sin(now * 0.0004 + p.floatSeed) * 0.15;
      p.baseY += p.vy + Math.cos(now * 0.00035 + p.floatSeed) * 0.15;

      if (p.baseX < -10) { p.baseX += w + 20; p.x += w + 20; }
      if (p.baseX > w + 10) { p.baseX -= w + 20; p.x -= w + 20; }
      if (p.baseY < -10) { p.baseY += h + 20; p.y += h + 20; }
      if (p.baseY > h + 10) { p.baseY -= h + 20; p.y -= h + 20; }

      let targetX = p.baseX;
      let targetY = p.baseY;

      if (mouse.x !== null) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.radius && dist > 0.01) {
          const force = (mouse.radius - dist) / mouse.radius;
          targetX += (dx / dist) * force * 20;
          targetY += (dy / dist) * force * 20;
        }
      }

      if (withIntro) {
        if (expandRaw < 1) {
          const radius = baseRadius + (maxRadius - baseRadius) * expandEased;
          const circleX = cx + radius * Math.cos(p.angle);
          const circleY = cy + radius * Math.sin(p.angle);
          targetX += (circleX - targetX) * circleFormEased;
          targetY += (circleY - targetY) * circleFormEased;
        } else if (!p.released) {
          p.released = true;
          p.baseX = p.x;
          p.baseY = p.y;
        }
      }

      p.x += (targetX - p.x) * 0.1;
      p.y += (targetY - p.y) * 0.1;

      const appearAlpha = easeInOutCubic(clamp01((elapsed - p.appearDelay) / p.appearDuration));

      const sprite = glowSprites[p.color];
      const size = p.r * 3;
      ctx.globalAlpha = p.alpha * appearAlpha;
      ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
      ctx.globalAlpha = 1;
    });

    requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);

  // listener su window (non sul canvas): niente elemento invisibile sopra puo' bloccarlo
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      mouse.x = x;
      mouse.y = y;
    } else {
      mouse.x = null;
      mouse.y = null;
    }
  });

  resize();
  makeParticles();
  requestAnimationFrame(step);
}

createParticleField(document.getElementById('particles-canvas'), {
  count: 260,
  withIntro: true,
  coverEl: coverWelcome,
});
createParticleField(document.getElementById('hero-particles-canvas'), {
  count: 90,
  withIntro: false,
});
createParticleField(document.getElementById('gate-particles-canvas'), {
  count: 90,
  withIntro: false,
});


/* =============================================================================
   D. Box-roll: il cover particellare ruota in 3D e sfuma, atterrando sulla hero
   ============================================================================= */
const rollStage = document.querySelector('.roll-stage');
const rollCover = document.querySelector('.roll-cover');

if (rollStage && rollCover && !reducedMotion) {
  const onRollScroll = () => {
    const rect = rollStage.getBoundingClientRect();
    const total = rollStage.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    const progress = Math.min(Math.max(scrolled / total, 0), 1);
    rollCover.style.transform = `rotateX(${progress * -100}deg) scale(${1 - progress * 0.1})`;
    rollCover.style.opacity = String(1 - progress * 1.15);
    rollCover.style.pointerEvents = progress > 0.85 ? 'none' : 'auto';
  };
  window.addEventListener('scroll', onRollScroll, { passive: true });
  onRollScroll();
}


/* =============================================================================
   E. Filtro progetti + menu mobile
   ============================================================================= */
const filterBtns = document.querySelectorAll('.filter-btn');
const workCards = document.querySelectorAll('.work-card');

function applyFilter(filter) {
  filterBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.filter === filter));
  workCards.forEach((card) => {
    const categories = (card.dataset.category || '').split(' ');
    const show = filter === 'all' || categories.includes(filter);
    card.classList.toggle('is-hidden', !show);
  });
}

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
});

/* il portfolio parte dal filtro coerente col profilo scelto — ma "Tutti" è
   sempre a un click di distanza: l'altra anima non viene mai nascosta d'ufficio */
function applyLensToFilters() {
  if (!filterBtns.length) return;
  applyFilter(lens ? LENS_FILTER[lens] : 'all');
}

const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  nav.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    })
  );
}

/* stato iniziale: profilo ereditato da URL o da sessionStorage, senza sweep */
setLens(readStoredLens(), { animate: false });
