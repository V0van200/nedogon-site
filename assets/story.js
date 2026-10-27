import { setPosterBackground } from './media-loading.js?v=1';
// Полноэкранные истории стран: смена фона между главами, проявление текста, лента моментов, занавес между странами.
import { stories } from './story-data.js';

const reduce = false; // анимации на сайте включены всегда
const TINTS = { in: '#ffb37a', ae: '#f3cf8a', mv: '#8fe3e0', th: '#b9e59c', id: '#9ee6b8', vn: '#a3d8ff' };
const CHAPTERS = ['Первые эмоции', 'История', 'Моменты', 'Финал'];
const CURTAIN_MS = 850;

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = (n) => String(n).padStart(2, '0');

const main = $('#story');
const chips = $('.chips');
const rail = $('.rail');
const curtain = $('.curtain');
const soundBtn = $('.sound');
const lamp = $('.lamp');
const progress = $('.progress');
const layers = [...document.querySelectorAll('.layer')];

let story = null;
let front = 0;
let stageKey = '';
let activeIdx = -1;
let sections = [];
let mediaPlan = [];
let observers = [];
let moments = null;

stories.forEach((s) => {
  const a = el('a', null, s.name);
  a.href = `#${s.id}`;
  chips.append(a);
});
CHAPTERS.forEach((label, i) => {
  const b = el('button');
  b.type = 'button';
  b.append(el('span', null, label), el('i'));
  b.setAttribute('aria-label', `Глава ${i + 1}: ${label}`);
  b.addEventListener('click', () => sections[i]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
  rail.append(b);
});

function words(node, text, cls = 'w') {
  text.split(/\s+/).forEach((w, i) => {
    const s = el('span', cls, w);
    s.style.setProperty('--i', i);
    node.append(s, ' ');
  });
  return node;
}

function letters(node, text) {
  node.setAttribute('aria-label', text);
  [...text].forEach((c, k) => {
    const clip = el('span', 'clip');
    const ch = el('span', 'ch', c === ' ' ? ' ' : c);
    ch.style.setProperty('--k', k);
    ch.setAttribute('aria-hidden', 'true');
    clip.append(ch);
    node.append(clip);
  });
  return node;
}

function mediaNode(m, { lazy = false } = {}) {
  if (m.video) {
    const v = el('video');
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: lazy ? 'none' : 'auto', poster: m.poster || '' });
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.src = m.video;
    if (m.fit) v.classList.add('fit');
    return v;
  }
  const img = el('img');
  img.src = m.img;
  img.alt = m.caption || '';
  img.decoding = 'async';
  if (lazy) img.loading = 'lazy';
  return img;
}

const play = (v) => v && !reduce && v.play().catch(() => {});
function releaseMedia(root) {
  root.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
}

// --- сцена ---
function setStage(media, key) {
  if (key === stageKey) return;
  stageKey = key;
  const next = layers[1 - front];
  const prev = layers[front];
  releaseMedia(next);
  const node = mediaNode(media);
  if (media.poster) {
    setPosterBackground(next, media.poster);
    next.style.backgroundSize = 'cover'; next.style.backgroundPosition = 'center';
    if(node.tagName === 'VIDEO') {
      node.style.opacity = '0';
      node.addEventListener('loadeddata', () => { node.style.opacity = '1'; }, {once:true});
      node.addEventListener('error', () => { node.style.opacity = '0'; });
    }
  } else { next.style.backgroundImage = ''; delete next.dataset.posterSource; }
  next.replaceChildren(node);
  play(next.querySelector('video'));
  next.classList.add('on');
  prev.classList.remove('on');
  front = 1 - front;
  setTimeout(() => { if (!prev.classList.contains('on')) { releaseMedia(prev); prev.replaceChildren(); } }, 1500);
}
const stageVideo = () => layers[front].querySelector('video');

// open.music: фоновое видео с музыкой — звук включается без перемотки и без скрытия текста
const soundLabel = (on) => (story?.open.music
  ? (on ? 'Выключить музыку' : 'Включить музыку')
  : (on ? 'Выключить звук' : 'Смотреть со звуком'));

function setSound(on) {
  const v = stageVideo();
  if (!v) return;
  const music = Boolean(story?.open.music);
  v.muted = !on;
  if (on && !music) v.currentTime = 0;
  if (on) v.play().catch(() => {});
  soundBtn.setAttribute('aria-pressed', String(on));
  document.body.classList.toggle('is-playing', on && !music);
  soundBtn.textContent = soundLabel(on);
}

// --- кинорежим: момент со звуком на весь экран ---
const cinema = el('dialog', 'cinema');
cinema.setAttribute('aria-label', 'Видео со звуком');
const cineVideo = el('video');
Object.assign(cineVideo, { controls: true, playsInline: true, preload: 'none' });
cineVideo.setAttribute('playsinline', '');
const cineTitle = el('p');
const cineLink = el('a');
Object.assign(cineLink, { target: '_blank', rel: 'noopener noreferrer' });
const cineCap = el('div', 'cinema-cap');
cineCap.append(cineTitle, cineLink);
const cineClose = el('button', 'cinema-close', '×');
cineClose.type = 'button';
cineClose.setAttribute('aria-label', 'Закрыть видео');
const cineState = el('p', 'cinema-state');
cineState.setAttribute('role', 'status');
const cineRetry = el('button', 'cinema-retry', 'Повторить загрузку');
cineRetry.type = 'button'; cineRetry.hidden = true;
let cineWaitTimer;
function waitingCinema() {
  if(!cinema.open) return;
  clearTimeout(cineWaitTimer);
  cineState.textContent = 'Видео загружается…'; cineRetry.hidden = true;
  cineWaitTimer = setTimeout(() => { if(cinema.open && cineVideo.readyState < 3) { cineState.textContent = 'Соединение медленное. Можно подождать или повторить загрузку.'; cineRetry.hidden = false; } }, 12000);
}
function playCinema() {
  cineVideo.play().catch(error => {
    if(!cinema.open || error.name === 'AbortError') return;
    if(error.name === 'NotAllowedError') cineState.textContent = 'Нажми ▶ в плеере, чтобы начать.';
  });
}
cineVideo.addEventListener('waiting', waitingCinema);
cineVideo.addEventListener('playing', () => { clearTimeout(cineWaitTimer); cineState.textContent = ''; cineRetry.hidden = true; });
cineVideo.addEventListener('error', () => {
  if(!cinema.open || !cineVideo.getAttribute('src')) return;
  clearTimeout(cineWaitTimer); cineState.textContent = 'Видео не удалось загрузить. Повтори загрузку или попробуй позже.'; cineRetry.hidden = false;
});
cineRetry.addEventListener('click', () => { waitingCinema(); cineVideo.load(); playCinema(); });
cinema.append(cineClose, cineVideo, cineState, cineRetry, cineCap);
document.body.append(cinema);

function openCinema(full, title, link, linkText) {
  if (soundBtn.getAttribute('aria-pressed') === 'true') setSound(false);
  stageVideo()?.pause();
  cineVideo.poster = full.poster || '';
  cineVideo.src = full.src;
  cineVideo.muted = false;
  cineTitle.textContent = title || '';
  cineLink.hidden = !link;
  if (link) { cineLink.href = link; cineLink.textContent = `${linkText || 'Открыть'} ↗`; }
  cinema.showModal();
  waitingCinema();
  playCinema();
}
function closeCinema() {
  if (!cinema.open) return;
  clearTimeout(cineWaitTimer);
  cineState.textContent = ''; cineRetry.hidden = true;
  cineVideo.pause();
  cineVideo.removeAttribute('src');
  cineVideo.load();
  cinema.close();
  play(stageVideo());
}
cineClose.addEventListener('click', closeCinema);
cinema.addEventListener('cancel', (e) => { e.preventDefault(); closeCinema(); });
cinema.addEventListener('click', (e) => { if (e.target === cinema) closeCinema(); });

function soundButton(label, full, title, link, linkText) {
  const b = el('button', 'film-play');
  b.type = 'button';
  b.append(el('b'), document.createTextNode(`${label} · ${full.dur}`));
  b.addEventListener('click', () => openCinema(full, title, link, linkText));
  return b;
}

// --- главы ---
function kicker(n) { return el('p', 'kicker', `Глава ${n} · ${CHAPTERS[n - 1]}`); }

function buildOpen(s) {
  const film = Boolean(s.open.sound) && !s.open.music;
  const sec = el('section', `chapter ch-open${film ? ' is-film' : ''}`);
  const box = el('div', `wrap${film ? ' film-head' : ''}`);
  if (film) box.append(kicker(1), el('p', 'open-meta', `${s.name} · ${s.years} · ${s.place}`));
  else box.append(kicker(1), letters(el('h1'), s.name), el('p', 'open-meta', `${s.years} · ${s.place}`));
  if (film) {
    const b = el('button', 'film-play');
    b.type = 'button';
    b.append(el('b'), document.createTextNode('Смотреть историю со звуком'));
    b.addEventListener('click', () => setSound(true));
    box.append(b, el('p', 'sub', s.open.sub));
  } else {
    box.append(words(el('blockquote', 'quote reveal'), `«${s.open.quote}»`), el('p', 'sub', s.open.sub));
    if (s.open.full) box.append(soundButton('Смотреть со звуком', s.open.full, s.open.full.title));
  }
  const cue = el('p', 'cue', 'Листай вниз');
  cue.prepend(el('i'));
  box.append(cue);
  sec.append(box);
  return sec;
}

function buildText(s) {
  const sec = el('section', 'chapter ch-text');
  const box = el('div', 'wrap');
  box.append(kicker(2), words(el('h2', 'reveal'), s.text.title));
  s.text.paragraphs.forEach((p, i) => box.append(words(el('p', `para${i % 2 ? ' shift' : ''}`), p)));
  sec.append(box);
  return sec;
}

function buildMoments(s) {
  const sec = el('section', 'chapter ch-moments');
  sec.style.height = `calc(100svh + ${s.moments.length * 55}svh)`;
  const pin = el('div', 'moments-pin');
  const head = el('div', 'wrap moments-head');
  const left = el('div');
  left.append(kicker(3), el('h2', null, 'Как это было'));
  const count = el('span', 'moments-count', `01 / ${pad(s.moments.length)}`);
  head.append(left, count);
  const track = el('div', 'track');
  s.moments.forEach((m, i) => {
    const fig = el('figure', 'card');
    const box = el('div', 'media');
    box.append(mediaNode(m, { lazy: true }), el('span', 'tag', m.role), el('span', 'no', pad(i + 1)));
    if (m.full) {
      box.classList.add('has-sound');
      const pb = el('button', 'card-play');
      pb.type = 'button';
      pb.append(el('b'), document.createTextNode(`Со звуком · ${m.full.dur}`));
      pb.setAttribute('aria-label', `Смотреть со звуком: ${m.caption}`);
      box.append(pb);
      box.addEventListener('click', () => openCinema(m.full, m.caption, m.link, m.linkText));
    }
    const cap = el('figcaption');
    cap.append(el('span', null, m.caption));
    if (m.link) {
      const a = el('a', null, `${m.linkText || 'Открыть'} ↗`);
      Object.assign(a, { href: m.link, target: '_blank', rel: 'noopener noreferrer' });
      cap.append(a);
    }
    fig.append(box, cap);
    track.append(fig);
  });
  pin.append(head, track);
  sec.append(pin);
  moments = { sec, track, count, cards: [...track.children], n: s.moments.length };
  return sec;
}

function buildFinale(s, next) {
  const sec = el('section', 'chapter ch-finale');
  const top = el('div', 'wrap');
  top.append(kicker(4), words(el('blockquote', 'quote reveal'), `«${s.finale.quote}»`), el('p', 'sub', s.finale.sub));
  if (s.finale.full) top.append(soundButton('Её слова со звуком', s.finale.full, s.finale.full.title));
  if (s.finale.link) {
    const a = el('a', 'finale-link', `${s.finale.linkText} ↗`);
    Object.assign(a, { href: s.finale.link, target: '_blank', rel: 'noopener noreferrer' });
    top.append(a);
  }
  const btn = el('button', 'next');
  btn.type = 'button';
  btn.append(el('small', null, 'Следующая история'), el('strong', null, next.name), el('em', null, `«${next.open.quote}»`));
  btn.addEventListener('click', () => { location.hash = `#${next.id}`; });
  const bottom = el('div', 'wrap');
  bottom.append(btn);
  sec.append(top, bottom);
  return sec;
}

function build(s) {
  closeCinema();
  releaseMedia(main);
  layers.forEach(layer => { releaseMedia(layer); layer.replaceChildren(); layer.classList.remove('on'); });
  observers.forEach((o) => o.disconnect());
  observers = [];
  story = s;
  activeIdx = -1;
  stageKey = '';
  const i = stories.indexOf(s);
  const next = stories[(i + 1) % stories.length];
  document.documentElement.style.setProperty('--tint', TINTS[s.id] || '#d5b0ef');
  document.title = `${s.name} — истории NEDOGONPOLYA`;
  chips.querySelectorAll('a').forEach((a) => {
    if (a.getAttribute('href') === `#${s.id}`) {
      a.setAttribute('aria-current', 'page');
      a.scrollIntoView({ block: 'nearest', inline: 'center' });
    } else {
      a.removeAttribute('aria-current');
    }
  });
  const openMedia = s.open.video ? { video: s.open.video, poster: s.open.poster, fit: !s.open.music } : s.open.media;
  mediaPlan = [[openMedia, 'o'], [s.text.media, 't'], [s.text.media, 't'], [s.finale.media, 'f']];
  sections = [buildOpen(s), buildText(s), buildMoments(s), buildFinale(s, next)];
  sections.forEach((sec, idx) => { sec.dataset.idx = idx; });
  main.replaceChildren(...sections);
  observe();
}

function activate(idx) {
  if (idx === activeIdx) return;
  activeIdx = idx;
  const [media, key] = mediaPlan[idx];
  setStage(media, `${story.id}-${key}`);
  const audible = idx === 0 && Boolean(story.open.sound);
  const film = audible && !story.open.music;
  document.body.classList.toggle('is-film', film);
  document.body.classList.toggle('is-text', idx === 1);
  document.body.classList.toggle('is-dim', idx === 2);
  [...rail.children].forEach((b, i) => (i === idx ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
  soundBtn.hidden = !audible;
  if (audible && soundBtn.getAttribute('aria-pressed') !== 'true') soundBtn.textContent = soundLabel(false);
  if (!audible && soundBtn.getAttribute('aria-pressed') === 'true') setSound(false);
}

function observe() {
  const chapterObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) activate(Number(e.target.dataset.idx)); });
  }, { rootMargin: '-50% 0px -50% 0px' });
  sections.forEach((s) => chapterObs.observe(s));

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } });
  }, { threshold: 0.35 });
  main.querySelectorAll('.ch-text .reveal, .ch-finale .reveal, .para').forEach((n) => revealObs.observe(n));

  const cardObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target.querySelector('video');
      if (!v) return;
      if (e.isIntersecting) play(v); else v.pause();
    });
  }, { threshold: 0.25 });
  moments.cards.forEach((c) => cardObs.observe(c));
  observers = [chapterObs, revealObs, cardObs];
  activate(0);
}

// --- прокрутка: прогресс, лента моментов, наклон карточек ---
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
    if (!moments || reduce) return;
    const r = moments.sec.getBoundingClientRect();
    const total = moments.sec.offsetHeight - innerHeight;
    const p = clamp(-r.top / total, 0, 1);
    const dist = Math.max(0, moments.track.scrollWidth - innerWidth * 0.75);
    moments.track.style.transform = `translate3d(${-p * dist}px,0,0)`;
    let best = 0;
    let bestD = Infinity;
    moments.cards.forEach((c, i) => {
      const b = c.getBoundingClientRect();
      const off = (b.left + b.width / 2 - innerWidth / 2) / innerWidth;
      if (Math.abs(off) < bestD) { bestD = Math.abs(off); best = i; }
      const m = c.firstElementChild;
      m.style.setProperty('--ry', `${clamp(-off * 14, -14, 14).toFixed(2)}deg`);
      m.style.setProperty('--sc', (1 - Math.min(Math.abs(off), 1) * 0.08).toFixed(3));
    });
    moments.count.textContent = `${pad(best + 1)} / ${pad(moments.n)}`;
  });
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);

// --- свет лампы за курсором ---
if (!reduce && matchMedia('(pointer: fine)').matches) {
  let raf = 0;
  addEventListener('pointermove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      lamp.style.setProperty('--mx', `${e.clientX}px`);
      lamp.style.setProperty('--my', `${e.clientY}px`);
    });
  }, { passive: true });
} else {
  lamp.hidden = true;
}

soundBtn.addEventListener('click', () => setSound(soundBtn.getAttribute('aria-pressed') !== 'true'));

// --- занавес между странами ---
function curtainText(s) {
  $('.curtain__meta', curtain).textContent = `${s.years} · ${s.place}`;
  const name = $('.curtain__name', curtain);
  name.replaceChildren();
  [...s.name].forEach((c, k) => {
    const ch = el('span', 'ch', c);
    ch.style.setProperty('--k', k);
    name.append(ch);
  });
}

function lift() {
  curtain.classList.remove('is-cover');
  curtain.classList.add('is-leave');
  setTimeout(() => {
    $('.ch-open', main)?.classList.add('in');
    main.querySelector('.ch-open .reveal')?.classList.add('in');
  }, reduce ? 0 : 250);
  setTimeout(() => {
    curtain.style.transition = 'none';
    curtain.classList.remove('is-leave');
    void curtain.offsetWidth;
    curtain.style.transition = '';
  }, reduce ? 0 : CURTAIN_MS + 50);
}

let navigationVersion = 0;
function go(id, first = false) {
  const version = ++navigationVersion;
  const s = stories.find((x) => x.id === id) || stories[0];
  if (story && s.id === story.id) { lift(); return; }
  curtainText(s);
  document.documentElement.style.setProperty('--tint', TINTS[s.id] || '#d5b0ef');
  const swap = () => {
    if(version !== navigationVersion) return false;
    if (soundBtn.getAttribute('aria-pressed') === 'true') setSound(false);
    build(s);
    scrollTo(0, 0);
    onScroll();
    return true;
  };
  if (reduce) { swap(); lift(); return; }
  if (first) { swap(); setTimeout(() => { if(version === navigationVersion) lift(); }, 900); return; }
  curtain.classList.remove('is-leave');
  curtain.classList.add('is-cover');
  setTimeout(() => { if(swap()) setTimeout(() => { if(version === navigationVersion) lift(); }, 380); }, CURTAIN_MS);
}

addEventListener('hashchange', () => go(location.hash.slice(1)));
go(location.hash.slice(1), true);
