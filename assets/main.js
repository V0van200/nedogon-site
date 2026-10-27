// Анимации и интерактив главной: буквы заголовка, линии скорости, прогресс забега, появление блоков, глобус путешествий.
import { TRIPS } from './trips.js';

document.documentElement.classList.add('js');
const reduce = false; // анимации на сайте включены всегда

// «Недогон» влетает по буквам
for (const el of document.querySelectorAll('[data-split]')) {
  const word = el.textContent.trim();
  el.setAttribute('aria-label', word);
  el.textContent = '';
  [...word].forEach((c, k) => {
    const s = document.createElement('span');
    s.className = 'ch'; s.textContent = c; s.style.setProperty('--k', k); s.setAttribute('aria-hidden', 'true');
    el.appendChild(s);
  });
}

// прогресс забега и шапка
const root = document.documentElement, top = document.querySelector('.top');
function onScroll() {
  const max = root.scrollHeight - innerHeight;
  root.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
  top.classList.toggle('is-solid', scrollY > 40);
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// появление блоков
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal').forEach((el, i) => {
  if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i % 4);
  io.observe(el);
});

// линии скорости на первом экране: быстрее, когда курсор/палец двигается
function speedLines(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, boost = 0, lines = [], on = true;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  function resize() {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, w / 14));
    lines = Array.from({ length: n }, () => spawn(true));
  }
  function spawn(any) {
    return { x: any ? Math.random() * w : -200, y: Math.random() * h, len: 40 + Math.random() * 220,
      v: 2 + Math.random() * 7, a: 0.04 + Math.random() * 0.22, red: Math.random() < 0.12 };
  }
  addEventListener('pointermove', (e) => { boost = Math.min(4, boost + Math.abs(e.movementX || 0) * 0.02); }, { passive: true });
  new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(canvas);
  new ResizeObserver(resize).observe(canvas); resize();
  (function frame() {
    requestAnimationFrame(frame);
    if (!on) return;
    ctx.clearRect(0, 0, w, h);
    boost *= 0.95;
    for (const l of lines) {
      l.x += l.v * (1 + boost);
      if (l.x - l.len > w) Object.assign(l, spawn(false));
      const g = ctx.createLinearGradient(l.x - l.len, 0, l.x, 0);
      const c = l.red ? '255,91,71' : '244,241,234';
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(1, `rgba(${c},${l.a})`);
      ctx.strokeStyle = g; ctx.lineWidth = l.red ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(l.x - l.len, l.y); ctx.lineTo(l.x, l.y); ctx.stroke();
    }
  })();
}
const speed = document.querySelector('.hero__speed');
if (speed && !reduce) speedLines(speed);

// путешествия: годы, список, карточка, глобус
const years = [...new Set(TRIPS.map((t) => t.year))].sort();
const yearsBox = document.querySelector('.trips__years');
const list = document.querySelector('.trips__list');
const card = document.querySelector('.trip-card');
let globe = null, current = null;

function chip(label, value) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'chip'; b.textContent = label; b.dataset.year = value;
  b.setAttribute('aria-pressed', value === 'all' ? 'true' : 'false');
  b.addEventListener('click', () => filter(value));
  yearsBox.appendChild(b);
}
chip('Все', 'all'); years.forEach((y) => chip(String(y), String(y)));

for (const t of TRIPS) {
  const li = document.createElement('li'); li.dataset.year = t.year;
  const b = document.createElement('button'); b.type = 'button'; b.dataset.id = t.id;
  const y = document.createElement('span'); y.className = 'y'; y.textContent = t.year;
  const p = document.createElement('span'); p.className = 'p'; p.textContent = t.place;
  const s = document.createElement('span'); s.className = 's'; s.textContent = t.sub;
  b.append(y, p, s);
  b.addEventListener('click', () => { select(t.id); globe && globe.focus(t.id); });
  li.appendChild(b); list.appendChild(li);
}

function filter(value) {
  yearsBox.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.year === value)));
  const shown = [];
  list.querySelectorAll('li').forEach((li) => {
    const ok = value === 'all' || li.dataset.year === value;
    li.hidden = !ok; if (ok) shown.push(li.querySelector('button').dataset.id);
  });
  if (!shown.includes(current)) { select(shown[0]); globe && globe.focus(shown[0]); }
}

function select(id) {
  const t = TRIPS.find((x) => x.id === id); if (!t) return;
  current = id;
  list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === id)));
  card.replaceChildren();
  const meta = document.createElement('p'); meta.className = 'meta'; meta.textContent = `${t.year} · ${t.sub}`;
  const h = document.createElement('h3'); h.textContent = t.place;
  const p = document.createElement('p'); p.textContent = t.text;
  card.append(meta, h, p);
  if (t.link) {
    const a = document.createElement('a'); a.href = t.link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = `${t.linkText} →`;
    card.appendChild(a);
  }
  card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
}
select(TRIPS[0].id);

// глобус грузим только когда секция близко — первый экран остаётся лёгким
const host = document.getElementById('globe');
function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
if (host && hasWebGL()) {
  const lazy = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    lazy.disconnect();
    try {
      const { initGlobe } = await import('./globe.js');
      globe = await initGlobe(host, TRIPS, { onSelect: select });
      globe.focus(current);
    } catch (err) {
      console.warn('глобус не запустился', err);
      host.classList.add('no-gl');
    }
  }, { rootMargin: '400px' });
  lazy.observe(host);
} else if (host) {
  host.classList.add('no-gl');
}
