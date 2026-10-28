// Раздел «Вне эфира» (#interests): экран стрима гаснет, часы идут по ночи, в главах — её видео.
// Текст и разметка — в index.html, здесь только движение. Новая глава = <article class="offair-ch" data-time="ЧЧ:ММ" data-label="…">
// в .offair-chapters: часы сами дойдут до её времени. Видео с data-src грузятся, только когда видны. Автор — Claude.
const PX = 27; // пикселей на секунду на дорожке монтажа — то же число в offair.css

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (v, a, b) => clamp((v - a) / (b - a)); // доля пути v внутри отрезка [a, b]
const ease = (t) => 1 - (1 - t) ** 3;

// время → минуты от 23:00, чтобы ночь шла подряд: 23:58 → 58, 00:40 → 100, 05:00 → 360
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return ((h + 1) % 24) * 60 + m;
};
const clock = (min) => {
  const m = Math.round(min);
  return `${String((Math.floor(m / 60) + 23) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

// долю на экране считаем сами: событие наблюдателя бывает запоздалым
const onScreen = (el, min = 0.25) => {
  const r = el.getBoundingClientRect();
  return r.height > 0 && (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height >= min;
};
const whenVisible = (el, cb) => new IntersectionObserver(() => cb(onScreen(el)), { threshold: [0, 0.25, 0.5] }).observe(el);
const lazyPlay = (video, on) => {
  if (!on) { video.pause(); return; }
  if (!video.src) video.src = video.dataset.src;
  video.play().catch(() => {});
};
// цикл на кадрах, пока видео играет
const whilePlaying = (video, tick) => {
  let raf = 0;
  const loop = () => { tick(); raf = video.paused ? 0 : requestAnimationFrame(loop); };
  video.addEventListener('play', () => { if (!raf) raf = requestAnimationFrame(loop); });
  tick();
};

function editor(fig) {
  const video = fig.querySelector('video');
  const tracks = fig.querySelector('[data-offair-tracks]');
  const tc = fig.querySelector('[data-offair-tc]');
  const offset = Number(video.dataset.offset || 0); // тизер вырезан из середины ролика
  whilePlaying(video, () => {
    const t = offset + video.currentTime;
    tracks.style.setProperty('--tx', `${(-t * PX).toFixed(1)}px`);
    tc.textContent = `00:${String(Math.floor(t)).padStart(2, '0')}`;
  });
  whenVisible(fig, (on) => lazyPlay(video, on));
}

function jump(fig) {
  const video = fig.querySelector('video');
  const bar = fig.querySelector('.offair-meter__bar b');
  // прыжок в ролике около 4-й секунды: шкала взлетает до «10 м», держится, потом честно падает
  whilePlaying(video, () => {
    const t = video.currentTime;
    const h = t < 3.7 ? 0 : t < 4.15 ? ease(seg(t, 3.7, 4.15)) : t < 6 ? 1 : 1 - 0.94 * ease(seg(t, 6, 6.6));
    bar.style.setProperty('--h', h.toFixed(3));
    fig.classList.toggle('is-felt', t >= 4.15 && t < 6.2);
    fig.classList.toggle('is-fact', t >= 6.6);
  });
  whenVisible(fig, (on) => lazyPlay(video, on));
}

function circle(btn) {
  const video = btn.querySelector('video');
  let sound = false;
  const label = btn.getAttribute('aria-label');
  const ring = () => {
    btn.style.setProperty('--pr', video.duration ? (video.currentTime / video.duration).toFixed(4) : '0');
    if (sound && !video.paused) requestAnimationFrame(ring);
  };
  const mute = () => {
    sound = false;
    Object.assign(video, { muted: true, loop: true });
    btn.classList.remove('is-sound');
    btn.setAttribute('aria-label', label);
  };
  btn.addEventListener('click', () => {
    if (sound) { mute(); return; }
    if (!video.src) video.src = video.dataset.src;
    sound = true;
    Object.assign(video, { muted: false, loop: false, currentTime: 0 });
    btn.classList.add('is-sound');
    btn.setAttribute('aria-label', 'Выключить звук у кружка');
    video.play().then(() => requestAnimationFrame(ring)).catch(mute);
  });
  video.addEventListener('ended', () => { mute(); video.play().catch(() => {}); });
  whenVisible(btn, (on) => {
    if (!on && sound) mute();
    lazyPlay(video, on);
  });
}

function poll(group) {
  const buttons = [...group.querySelectorAll('button[data-burst]')];
  buttons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
  group.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-burst]');
    if (!b) return;
    buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const r = b.getBoundingClientRect();
    for (let k = 0; k < 9; k += 1) {
      const s = document.createElement('span');
      s.className = 'offair-burst';
      s.textContent = b.dataset.burst;
      s.setAttribute('aria-hidden', 'true');
      Object.assign(s.style, { left: `${r.left + r.width / 2}px`, top: `${r.top}px` });
      document.body.append(s);
      const dx = (Math.random() - 0.5) * 180;
      const dy = -90 - Math.random() * 130;
      const turn = (Math.random() - 0.5) * 70;
      s.animate([
        { transform: 'translate(-50%, 0) scale(.5)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), ${dy}px) rotate(${turn}deg) scale(1.15)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => s.remove();
    }
  });
}

// пожелание по словам: неразрывные пробелы склеивают «из вас», «к чему» в одно слово
function splitWords(p) {
  if (!p) return [];
  const words = p.textContent.trim().split(' ');
  const spans = words.map((w, i) => {
    const s = document.createElement('span');
    s.className = i >= words.length - 2 ? 'w is-accent' : 'w';
    s.textContent = w;
    return s;
  });
  p.replaceChildren(...spans.flatMap((s, i) => (i ? [' ', s] : [s])));
  return spans;
}

function init(root) {
  root.classList.add('is-live');
  const intro = root.querySelector('[data-offair-intro]');
  const screen = root.querySelector('.offair-screen');
  const stream = root.querySelector('.offair-screen__video');
  const chapters = [...root.querySelectorAll('.offair-ch[data-time]')];
  const timeEl = root.querySelector('[data-offair-time]');
  const labelEl = root.querySelector('[data-offair-label]');
  const face = root.querySelector('.offair-clock__face');
  const [night, blue, snow, dawn] = root.querySelectorAll('.offair-sky i');
  const wish = root.querySelector('[data-offair-words]');
  const words = splitWords(wish);
  const stops = [
    { min: toMin('23:58'), label: labelEl.textContent, top: () => intro.getBoundingClientRect().bottom },
    ...chapters.map((ch) => ({ min: toMin(ch.dataset.time), label: ch.dataset.label || '', top: () => ch.getBoundingClientRect().top })),
  ];
  let streamOn = false;
  let shown = '';

  const reveal = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    reveal.unobserve(e.target);
  }), { rootMargin: '0px 0px -15% 0px' });
  chapters.forEach((ch) => reveal.observe(ch));

  const update = () => {
    // 1. экран: живой → схлопывается в линию → в точку → OFFLINE и заголовок
    const r = intro.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
    const s = screen.style;
    s.setProperty('--live', (1 - seg(p, 0.2, 0.3)).toFixed(3));
    s.setProperty('--sy', (1 - 0.994 * ease(seg(p, 0.28, 0.42))).toFixed(4));
    s.setProperty('--br', (1 + 1.6 * seg(p, 0.28, 0.42)).toFixed(3));
    s.setProperty('--sx', (1 - 0.99 * ease(seg(p, 0.42, 0.52))).toFixed(4));
    s.setProperty('--dot', (seg(p, 0.42, 0.5) * (1 - seg(p, 0.56, 0.66))).toFixed(3));
    s.setProperty('--off', (seg(p, 0.52, 0.62) * (1 - seg(p, 0.92, 1))).toFixed(3));
    intro.style.setProperty('--ti', ease(seg(p, 0.6, 0.8)).toFixed(3));
    const live = p < 0.42 && r.bottom > 0 && r.top < innerHeight;
    if (live !== streamOn) { streamOn = live; lazyPlay(stream, live); }

    // 2. часы: пока читаешь главу, стоят на её времени, а на подходе к следующей докручиваются
    const mid = innerHeight * 0.45;
    const tops = stops.map((st) => st.top());
    let i = 0;
    while (i < stops.length - 1 && tops[i + 1] <= mid) i += 1;
    const next = stops[i + 1];
    const min = next ? stops[i].min + (next.min - stops[i].min) * seg(seg(mid, tops[i], tops[i + 1]), 0.6, 1) : stops[i].min;
    const text = clock(min);
    if (text !== shown) {
      shown = text;
      timeEl.textContent = text;
      labelEl.textContent = stops[i].label;
      const m = Math.round(min);
      const h = (Math.floor(m / 60) + 23) % 24;
      face.style.setProperty('--ma', `${(m % 60) * 6}deg`);
      face.style.setProperty('--ha', `${((h % 12) + (m % 60) / 60) * 30}deg`);
    }

    // 3. небо: фиолетовая ночь → синий час к 05:00 → снег к 10:20 → тёплый рассвет к 11:11
    night.style.opacity = (1 - seg(min, 100, 360)).toFixed(3);
    blue.style.opacity = clamp(1 - Math.abs(min - 360) / 260).toFixed(3);
    snow.style.opacity = clamp(1 - Math.abs(min - 680) / 240).toFixed(3);
    dawn.style.opacity = seg(min, 680, 731).toFixed(3);

    // 4. пожелание загорается по словам
    if (wish) {
      const w = wish.getBoundingClientRect();
      const lit = Math.ceil(words.length * seg(innerHeight * 0.85 - w.top, 0, w.height + innerHeight * 0.3));
      words.forEach((sp, k) => sp.classList.toggle('is-lit', k < lit));
    }
  };

  let raf = 0;
  const request = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      addEventListener('scroll', request, { passive: true });
      addEventListener('resize', request);
      request();
    } else {
      removeEventListener('scroll', request);
      removeEventListener('resize', request);
      if (streamOn) { streamOn = false; stream.pause(); }
    }
  }).observe(root);

  root.querySelectorAll('[data-offair-editor]').forEach(editor);
  root.querySelectorAll('[data-offair-jump]').forEach(jump);
  root.querySelectorAll('[data-offair-circle]').forEach(circle);
  root.querySelectorAll('.offair-poll').forEach(poll);
  update();
}

const section = document.querySelector('[data-offair]');
if (section) init(section);
