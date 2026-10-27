// Клипы из content/media/library.json в блоках главной: <div data-clips="cooking"></div>.
// Карточка: постер; на ПК при наведении — беззвучное превью. По клику видео «вырастает» из карточки
// в свой плеер (цветок-бегунок, цветок-громкость). Показываем только status = "published".
// Автор модуля — Claude, правила — docs/COLLAB.md.
const LIB = 'content/media/library.json';
const root = document.documentElement;
const systemReduce = matchMedia('(prefers-reduced-motion: reduce)');
const canHover = matchMedia('(hover: hover) and (pointer: fine)');
const motionOff = () => systemReduce.matches || root.classList.contains('reduce-motion');
const saveData = () => Boolean(navigator.connection && navigator.connection.saveData);
const EASE = 'cubic-bezier(.2,.8,.2,1)';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const fmt = (s) => {
  const t = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};
function flower(cls) {
  const f = el('span', `cp-flower ${cls || ''}`);
  for (let k = 0; k < 6; k += 1) { const p = el('i'); p.style.setProperty('--k', k); f.append(p); }
  f.append(el('b'));
  f.setAttribute('aria-hidden', 'true');
  return f;
}
const ICONS = {
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  pause: '<rect x="6.5" y="5" width="4" height="14" rx="1.4"/><rect x="13.5" y="5" width="4" height="14" rx="1.4"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  cc: '<rect x="3" y="5.5" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10.5 10.2a2.4 2.4 0 1 0 0 3.6M17 10.2a2.4 2.4 0 1 0 0 3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
};
function icon(name) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.classList.add(`cp-i-${name}`);
  s.innerHTML = ICONS[name];
  return s;
}
const button = (cls, label, ...kids) => {
  const b = el('button', cls);
  b.type = 'button';
  if (label) b.setAttribute('aria-label', label);
  b.append(...kids);
  return b;
};

// ---------- плеер ----------
let P = null;

function buildPlayer() {
  const dialog = el('dialog', 'clip-dialog');
  dialog.setAttribute('aria-label', 'Видео');
  const shade = el('div', 'clip-dialog__shade');
  const box = el('div', 'clip-player');
  const close = button('clip-player__close', 'Закрыть видео', '×');

  const stage = el('div', 'clip-player__stage');
  const video = el('video', 'clip-player__video');
  Object.assign(video, { playsInline: true, preload: 'none', disableRemotePlayback: true });
  video.setAttribute('playsinline', '');
  video.setAttribute('disableremoteplayback', '');
  const track = el('track');
  Object.assign(track, { kind: 'subtitles', srclang: 'ru', label: 'Русские', default: true });
  // субтитры поднимаем над панелью управления
  track.addEventListener('load', () => { [...(track.track.cues || [])].forEach((c) => { c.line = -4; }); });
  video.append(track);
  const flash = el('span', 'clip-player__flash');
  flash.append(icon('play'), icon('pause'));
  const error = el('div', 'clip-player__error');
  error.hidden = true;
  const retry = button('clip-player__retry', null, 'Повторить');
  error.append(el('p', null, 'Видео не загрузилось. Проверьте интернет и попробуйте ещё раз.'), retry);

  const bar = el('div', 'clip-player__bar');
  const play = button('cp-btn cp-play', 'Смотреть', icon('play'), icon('pause'));
  const time = el('span', 'cp-time', '0:00');
  const progress = el('div', 'cp-progress');
  progress.tabIndex = 0;
  progress.setAttribute('role', 'slider');
  progress.setAttribute('aria-label', 'Перемотка');
  const buffer = el('span', 'cp-buffer');
  const fill = el('span', 'cp-fill');
  const thumb = flower('cp-thumb');
  progress.append(buffer, fill, thumb);
  const dur = el('span', 'cp-time cp-dur', '0:00');
  const volFlower = flower('cp-volflower');
  const volBtn = button('cp-btn cp-vol__btn', 'Выключить звук', volFlower);
  const volRange = el('input', 'cp-vol__range');
  Object.assign(volRange, { type: 'range', min: 0, max: 1, step: 0.05, value: 0.9 });
  volRange.setAttribute('aria-label', 'Громкость');
  const vol = el('div', 'cp-vol');
  vol.append(volBtn, volRange);
  const cc = button('cp-btn cp-cc', 'Субтитры', icon('cc'));
  const full = button('cp-btn cp-full', 'На весь экран', icon('full'));
  bar.append(play, time, progress, dur, vol, cc, full);
  stage.append(video, flash, error, bar);

  const meta = el('div', 'clip-player__meta');
  const title = el('h3');
  const summary = el('p');
  const source = el('a', 'clip-player__source', 'Полная нарезка ↗');
  Object.assign(source, { target: '_blank', rel: 'noopener noreferrer' });
  meta.append(title, summary, source);
  box.append(close, stage, meta);
  dialog.append(shade, box);
  document.body.append(dialog);

  P = { dialog, shade, box, stage, video, track, flash, error, bar, play, time, progress, buffer, fill, thumb, dur,
    volBtn, volFlower, volRange, cc, full, close, meta, title, summary, source, opener: null, idle: 0, lastVol: 0.9, closing: false };

  const toggle = () => (video.paused ? video.play().catch(() => {}) : video.pause());
  play.addEventListener('click', toggle);
  video.addEventListener('click', toggle);
  video.addEventListener('play', () => syncPlay(true));
  video.addEventListener('pause', () => syncPlay(false));
  video.addEventListener('timeupdate', syncTime);
  video.addEventListener('progress', syncBuffer);
  video.addEventListener('loadedmetadata', () => { dur.textContent = fmt(video.duration); syncTime(); });
  video.addEventListener('error', () => { if (video.getAttribute('src')) error.hidden = false; });
  retry.addEventListener('click', () => { error.hidden = true; video.load(); video.play().catch(() => {}); });

  // перемотка: клик, перетаскивание, клавиатура
  const seekTo = (e) => {
    const r = progress.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    if (video.duration) video.currentTime = x * video.duration;
    syncTime();
  };
  progress.addEventListener('pointerdown', (e) => {
    progress.setPointerCapture(e.pointerId);
    progress.classList.add('is-scrub');
    seekTo(e);
  });
  progress.addEventListener('pointermove', (e) => { if (progress.classList.contains('is-scrub')) seekTo(e); });
  const endScrub = () => progress.classList.remove('is-scrub');
  progress.addEventListener('pointerup', endScrub);
  progress.addEventListener('pointercancel', endScrub);
  progress.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    e.stopPropagation();
    seekBy(e.key === 'ArrowRight' ? 5 : -5);
  });

  // громкость: цветок раскрывается громче и закрывается в бутон тише
  volRange.addEventListener('input', () => setVolume(Number(volRange.value)));
  volBtn.addEventListener('click', () => setVolume(video.muted || video.volume === 0 ? P.lastVol : 0));

  cc.addEventListener('click', () => {
    const t = video.textTracks[0];
    if (!t) return;
    t.mode = t.mode === 'showing' ? 'hidden' : 'showing';
    cc.setAttribute('aria-pressed', String(t.mode === 'showing'));
  });
  full.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (stage.requestFullscreen) stage.requestFullscreen().catch(() => {});
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  });

  // панель прячется, если мышь не двигается
  const wake = () => {
    stage.classList.remove('is-idle');
    clearTimeout(P.idle);
    P.idle = setTimeout(() => { if (!video.paused && !bar.matches(':hover')) stage.classList.add('is-idle'); }, 2300);
  };
  stage.addEventListener('pointermove', wake);
  stage.addEventListener('pointerdown', wake);

  close.addEventListener('click', closePlayer);
  shade.addEventListener('click', closePlayer);
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); closePlayer(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.target === volRange) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'k' || k === 'л') { e.preventDefault(); toggle(); }
    else if (k === 'm' || k === 'ь') setVolume(video.muted ? P.lastVol : 0);
    else if (k === 'f' || k === 'а') full.click();
    else if (k === 'arrowright') seekBy(5);
    else if (k === 'arrowleft') seekBy(-5);
    else if (k === 'arrowup') { e.preventDefault(); setVolume(video.volume + 0.1); }
    else if (k === 'arrowdown') { e.preventDefault(); setVolume(video.volume - 0.1); }
    wake();
  });
}

function seekBy(sec) {
  const v = P.video;
  v.currentTime = Math.min(v.duration || 0, Math.max(0, v.currentTime + sec));
}

function syncPlay(playing) {
  P.stage.classList.toggle('is-playing', playing);
  P.play.setAttribute('aria-label', playing ? 'Пауза' : 'Смотреть');
  if (motionOff()) return;
  P.flash.classList.toggle('show-pause', !playing);
  P.flash.animate([{ opacity: 0.9, transform: 'translate(-50%,-50%) scale(.7)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.4)' }],
    { duration: 540, easing: EASE });
}
function syncTime() {
  const v = P.video;
  const r = v.duration ? v.currentTime / v.duration : 0;
  P.fill.style.transform = `scaleX(${r})`;
  P.thumb.style.left = `${r * 100}%`;
  P.thumb.style.setProperty('--spin', `${r * 540}deg`);
  P.time.textContent = fmt(v.currentTime);
  P.progress.setAttribute('aria-valuenow', String(Math.round(v.currentTime)));
  P.progress.setAttribute('aria-valuemax', String(Math.round(v.duration || 0)));
  P.progress.setAttribute('aria-valuetext', `${fmt(v.currentTime)} из ${fmt(v.duration)}`);
}
function syncBuffer() {
  const v = P.video;
  if (!v.duration || !v.buffered.length) return;
  P.buffer.style.transform = `scaleX(${v.buffered.end(v.buffered.length - 1) / v.duration})`;
}

let burstAt = 0;
function setVolume(value) {
  const v = P.video;
  const before = v.muted ? 0 : v.volume;
  const next = Math.min(1, Math.max(0, Math.round(value * 100) / 100));
  v.volume = next;
  v.muted = next === 0;
  if (next > 0) P.lastVol = next;
  P.volRange.value = String(next);
  P.volRange.style.setProperty('--v', next);
  P.volFlower.style.setProperty('--open', (next === 0 ? 0.22 : 0.4 + next * 0.6).toFixed(2));
  P.volBtn.setAttribute('aria-label', next === 0 ? 'Включить звук' : 'Выключить звук');
  P.volBtn.classList.toggle('is-muted', next === 0);
  const now = performance.now();
  if (!motionOff() && P.dialog.open && Math.abs(next - before) > 0.01 && now - burstAt > 110) {
    burstAt = now;
    petals(next > before);
  }
}
function petals(up) {
  for (let i = 0; i < 3; i += 1) {
    const p = el('span', 'cp-petal');
    P.volBtn.append(p);
    const dx = (Math.random() - 0.5) * 34;
    const dy = up ? -(26 + Math.random() * 22) : 22 + Math.random() * 18;
    const rot = (Math.random() - 0.5) * 220;
    p.animate([{ opacity: 0.95, transform: 'translate(-50%,-50%) scale(.6) rotate(0)' },
      { opacity: 0, transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${up ? 1.1 : 0.5}) rotate(${rot}deg)` }],
    { duration: 620 + i * 90, easing: up ? 'cubic-bezier(.1,.7,.3,1)' : 'cubic-bezier(.4,0,.8,.6)' }).onfinish = () => p.remove();
  }
}

// FLIP: видео вырастает из карточки и сворачивается обратно
function flip(rect, reverse) {
  const to = P.stage.getBoundingClientRect();
  if (!rect || !rect.width || !to.width) return null;
  const from = { transform: `translate(${rect.left - to.left}px, ${rect.top - to.top}px) scale(${rect.width / to.width}, ${rect.height / to.height})`, borderRadius: '9px' };
  const end = { transform: 'none', borderRadius: '14px' };
  return P.stage.animate(reverse ? [end, from] : [from, end], { duration: reverse ? 420 : 560, easing: EASE, fill: 'both' });
}
const chrome = () => [P.bar, P.meta, P.close];

function openPlayer(item, card, preview) {
  if (!P) buildPlayer();
  const { dialog, video, track } = P;
  P.opener = card;
  dialog.classList.toggle('is-vertical', item.height > item.width);
  P.title.textContent = item.title;
  P.summary.textContent = item.summary || '';
  P.source.hidden = !item.sourceUrl;
  if (item.sourceUrl) P.source.href = item.sourceUrl;
  P.source.textContent = item.kind === 'short' ? 'Шортс на YouTube ↗' : 'Полная нарезка ↗';
  P.cc.hidden = !item.captions;
  P.error.hidden = true;
  video.poster = item.poster || '';
  if (item.captions) track.src = item.captions; else track.removeAttribute('src');
  const start = preview && preview.currentTime > 0.2 ? preview.currentTime : 0;
  video.src = item.src;
  video.preload = 'auto';
  if (start) video.addEventListener('loadedmetadata', () => { video.currentTime = start; }, { once: true });
  setVolume(P.lastVol);
  P.cc.setAttribute('aria-pressed', 'true');
  root.classList.add('clip-open');
  dialog.showModal();
  video.play().catch(() => {});
  if (motionOff()) return;
  flip((card.querySelector('.clip-card__media') || card).getBoundingClientRect(), false);
  P.shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480, easing: 'ease-out' });
  chrome().forEach((n, i) => {
    n.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { duration: 360, delay: 260 + i * 60, easing: EASE, fill: 'backwards' });
  });
}

function closePlayer() {
  if (!P || !P.dialog.open || P.closing) return;
  P.closing = true;
  const finish = () => {
    [P.stage, P.shade, ...chrome()].forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    P.video.pause();
    P.video.removeAttribute('src');
    P.video.load();
    P.dialog.close();
    root.classList.remove('clip-open');
    P.closing = false;
    if (P.opener) P.opener.focus({ preventScroll: true });
  };
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (motionOff() || !P.opener) { finish(); return; }
  const anim = flip((P.opener.querySelector('.clip-card__media') || P.opener).getBoundingClientRect(), true);
  P.shade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-in', fill: 'forwards' });
  chrome().forEach((n) => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }));
  // страховка: на слабом компьютере анимация может стартовать с задержкой — окно всё равно закроется
  let done = false;
  const end = () => { if (!done) { done = true; finish(); } };
  if (anim) { anim.onfinish = end; setTimeout(end, 650); } else end();
}

// ---------- карточки ----------
function card(item) {
  const media = el('span', 'clip-card__media');
  const img = el('img');
  Object.assign(img, { src: item.poster, alt: '', loading: 'lazy', decoding: 'async' });
  media.append(img, el('span', 'clip-card__play'), el('span', 'clip-card__time', fmt(item.durationSeconds)));
  const text = el('span', 'clip-card__text');
  text.append(el('span', 'clip-card__label', 'Смотреть клип'), el('span', 'clip-card__title', item.title));
  if (item.summary) text.append(el('span', 'clip-card__summary', item.summary));
  const b = button('clip-card', `Смотреть: ${item.title}, ${fmt(item.durationSeconds)}`, media, text);

  // превью при наведении мыши: только ПК, без экономии трафика и с включёнными анимациями
  let preview = null;
  let timer = 0;
  b.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !canHover.matches || motionOff() || saveData()) return;
    timer = setTimeout(() => {
      if (!preview) {
        preview = el('video', 'clip-card__preview');
        Object.assign(preview, { muted: true, loop: true, playsInline: true, preload: 'auto', src: item.src });
        preview.setAttribute('muted', '');
        preview.setAttribute('playsinline', '');
        preview.setAttribute('aria-hidden', 'true');
        media.append(preview);
      }
      preview.play().then(() => media.classList.add('is-previewing')).catch(() => {});
    }, 220);
  });
  b.addEventListener('pointerleave', () => {
    clearTimeout(timer);
    media.classList.remove('is-previewing');
    if (preview) setTimeout(() => { if (!media.classList.contains('is-previewing')) preview.pause(); }, 350);
  });
  b.addEventListener('click', () => {
    clearTimeout(timer);
    openPlayer(item, b, preview);
    if (preview) { preview.pause(); media.classList.remove('is-previewing'); }
  });
  return b;
}

// ---------- «Состав»: стримеры, с кем Полина снималась (content/media/people.json) ----------
const plural = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'совместная нарезка'
  : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'совместные нарезки' : 'совместных нарезок');
const outLink = (text, href, cls) => {
  const a = el('a', cls, text);
  Object.assign(a, { href, target: '_blank', rel: 'noopener noreferrer' });
  return a;
};

function personCard(p, i, byId) {
  const card = el('article', 'crew');
  card.style.setProperty('--h', String((i * 47 + 280) % 360));
  const top = el('div', 'crew__top');
  const mono = el('span', 'crew__mono', p.name.replace(/[^A-Za-zА-Яа-яЁё0-9]/g, '').slice(0, 2).toUpperCase());
  mono.setAttribute('aria-hidden', 'true');
  const head = el('div', 'crew__head');
  head.append(el('h3', null, p.name), el('span', 'crew__count', `${p.count} ${plural(p.count)}`));
  top.append(mono, head);
  if (p.twitch) {
    const t = outLink('Twitch ↗', p.twitch, 'crew__twitch');
    t.setAttribute('aria-label', `${p.name} на Twitch`);
    top.append(t);
  }
  card.append(top, el('p', 'crew__line', p.line));
  if (p.members && p.members.length) {
    const m = el('p', 'crew__members');
    p.members.forEach((x, k) => { m.append(outLink(x.name, x.twitch)); if (k < p.members.length - 1) m.append(' · '); });
    card.append(m);
  }
  const clips = (p.clips || []).map((id) => byId.get(id)).filter(Boolean);
  if (clips.length) {
    const box = el('div', 'crew__clips');
    clips.forEach((c) => {
      const b = el('button', 'crew__play');
      b.type = 'button';
      b.dataset.play = c.id;
      b.setAttribute('aria-label', `Смотреть момент: ${c.title}`);
      b.append(el('span', 'crew__play-icon'), el('span', 'crew__play-title', c.title), el('small', null, fmt(c.durationSeconds)));
      box.append(b);
    });
    card.append(box);
  }
  if (p.projects && p.projects.length) {
    const ul = el('ul', 'crew__projects');
    p.projects.forEach((pr) => {
      const li = el('li');
      li.append(outLink(`${pr.title} ↗`, `https://www.youtube.com/watch?v=${pr.youtube}`));
      ul.append(li);
    });
    card.append(el('span', 'crew__label', 'Вместе на канале'), ul);
  }
  return card;
}

async function renderPeople(byId) {
  const hosts = [...document.querySelectorAll('[data-people]')];
  if (!hosts.length) return;
  let people = [];
  try {
    people = (await (await fetch('content/media/people.json', { cache: 'no-cache' })).json()).people || [];
  } catch (e) {
    console.warn('clips: состав не загрузился', e);
    return;
  }
  hosts.forEach((host) => host.replaceChildren(...people.map((p, i) => personCard(p, i, byId))));
}

async function init() {
  if (!document.querySelector('[data-clips], [data-people], [data-play]')) return;
  let items = [];
  try {
    items = (await (await fetch(LIB, { cache: 'no-cache' })).json()).items || [];
  } catch (e) {
    console.warn('clips: библиотека не загрузилась', e);
    return;
  }
  const ready = items.filter((i) => i.status === 'published' && i.src && i.poster);
  const byId = new Map(ready.map((i) => [i.id, i]));
  await renderPeople(byId);
  // любая кнопка с data-play="<id>" открывает клип в плеере
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-play]');
    const item = b && byId.get(b.dataset.play);
    if (!item) return;
    e.preventDefault();
    openPlayer(item, b, null);
  });
  const slots = [...document.querySelectorAll('[data-clips]')];
  slots.forEach((slot) => {
    // data-ids="a,b,c" — конкретные клипы по порядку; иначе — по теме data-clips
    const ids = (slot.dataset.ids || '').split(',').map((s) => s.trim()).filter(Boolean);
    const list = ids.length
      ? ids.map((id) => ready.find((i) => i.id === id)).filter(Boolean)
      // по теме: широкие клипы; шортсы — только если data-kind="short"
      : ready.filter((i) => i.topic === slot.dataset.clips && (slot.dataset.kind ? i.kind === slot.dataset.kind : i.kind !== 'short'))
        .slice(0, Number(slot.dataset.limit || 3));
    if (!list.length) return;
    slot.classList.add('clip-slot');
    if (slot.dataset.layout === 'row') slot.classList.add('clip-slot--row');
    if (slot.dataset.layout === 'shorts') slot.classList.add('clip-slot--shorts');
    slot.replaceChildren(...list.map(card));
    // data-more="cooking.html" data-more-label="Все кукинги" — ссылка на страницу раздела под карточками
    if (slot.dataset.more) {
      const label = slot.dataset.moreLabel || 'Все клипы';
      if (slot.dataset.moreImage) {
        // крупная карточка-переход: фото, заголовок, строка о разделе, кнопка
        const more = el('a', 'clip-promo');
        more.href = slot.dataset.more;
        const img = el('img');
        Object.assign(img, { src: slot.dataset.moreImage, alt: '', loading: 'lazy', decoding: 'async' });
        const txt = el('span', 'clip-promo__text');
        txt.append(el('span', 'clip-promo__eyebrow', 'Раздел'), el('span', 'clip-promo__title', label));
        if (slot.dataset.moreText) txt.append(el('span', 'clip-promo__sub', slot.dataset.moreText));
        more.append(el('span', 'clip-promo__media'), txt, el('span', 'clip-promo__go', 'Открыть →'));
        more.querySelector('.clip-promo__media').append(img);
        slot.append(more);
      } else {
        const more = el('a', 'clip-more', `${label} →`);
        more.href = slot.dataset.more;
        slot.append(more);
      }
    }
  });
}

init();
