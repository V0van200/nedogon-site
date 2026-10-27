// Клипы из content/media/library.json в блоках главной: <div data-clips="cooking"></div>.
// Карточка — постер и кнопка; видео грузится только по клику и открывается поверх страницы.
// Показываем только status = "published". Автор модуля — Claude, правила — docs/COLLAB.md.
const LIB = 'content/media/library.json';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

let dialog, video, track, titleEl, summaryEl, sourceEl, errorBox, lastFocus;

function buildDialog() {
  dialog = el('dialog', 'clip-dialog');
  dialog.setAttribute('aria-label', 'Видео');
  const box = el('div', 'clip-dialog__box');
  const close = el('button', 'clip-dialog__close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Закрыть видео');
  close.addEventListener('click', () => dialog.close());
  video = el('video', 'clip-dialog__video');
  Object.assign(video, { controls: true, playsInline: true, preload: 'none' });
  video.setAttribute('playsinline', '');
  track = el('track');
  Object.assign(track, { kind: 'subtitles', srclang: 'ru', label: 'Русские', default: true });
  video.append(track);
  errorBox = el('div', 'clip-dialog__error');
  errorBox.hidden = true;
  const retry = el('button', 'clip-dialog__retry', 'Повторить');
  retry.type = 'button';
  retry.addEventListener('click', () => { errorBox.hidden = true; video.load(); video.play().catch(() => {}); });
  errorBox.append(el('p', null, 'Видео не загрузилось. Проверьте интернет и попробуйте ещё раз.'), retry);
  const meta = el('div', 'clip-dialog__meta');
  titleEl = el('h3');
  summaryEl = el('p');
  sourceEl = el('a', 'clip-dialog__source', 'Полная нарезка ↗');
  Object.assign(sourceEl, { target: '_blank', rel: 'noopener noreferrer' });
  meta.append(titleEl, summaryEl, sourceEl);
  box.append(close, video, errorBox, meta);
  dialog.append(box);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    document.documentElement.classList.remove('clip-open');
    lastFocus?.focus();
  });
  video.addEventListener('error', () => { errorBox.hidden = false; });
  document.body.append(dialog);
}

function open(item, opener) {
  if (!dialog) buildDialog();
  lastFocus = opener;
  dialog.classList.toggle('is-vertical', item.height > item.width);
  titleEl.textContent = item.title;
  summaryEl.textContent = item.summary || '';
  sourceEl.hidden = !item.sourceUrl;
  if (item.sourceUrl) sourceEl.href = item.sourceUrl;
  errorBox.hidden = true;
  video.poster = item.poster || '';
  if (item.captions) { track.src = item.captions; track.hidden = false; } else { track.removeAttribute('src'); }
  video.src = item.src;
  document.documentElement.classList.add('clip-open');
  dialog.showModal();
  video.play().catch(() => {});
}

function card(item) {
  const b = el('button', 'clip-card');
  b.type = 'button';
  b.setAttribute('aria-label', `Смотреть: ${item.title}, ${fmt(item.durationSeconds)}`);
  const media = el('span', 'clip-card__media');
  const img = el('img');
  Object.assign(img, { src: item.poster, alt: '', loading: 'lazy', decoding: 'async' });
  media.append(img, el('span', 'clip-card__play'), el('span', 'clip-card__time', fmt(item.durationSeconds)));
  const text = el('span', 'clip-card__text');
  text.append(el('span', 'clip-card__label', 'Смотреть клип'), el('span', 'clip-card__title', item.title));
  if (item.summary) text.append(el('span', 'clip-card__summary', item.summary));
  b.append(media, text);
  b.addEventListener('click', () => open(item, b));
  return b;
}

async function init() {
  const slots = [...document.querySelectorAll('[data-clips]')];
  if (!slots.length) return;
  let items = [];
  try {
    items = (await (await fetch(LIB, { cache: 'no-cache' })).json()).items || [];
  } catch (e) {
    console.warn('clips: библиотека не загрузилась', e);
    return;
  }
  const ready = items.filter((i) => i.status === 'published' && i.src && i.poster);
  slots.forEach((slot) => {
    const list = ready.filter((i) => i.topic === slot.dataset.clips).slice(0, Number(slot.dataset.limit || 3));
    if (!list.length) return;
    slot.classList.add('clip-slot');
    if (reduce) slot.classList.add('no-motion');
    slot.replaceChildren(...list.map(card));
  });
}

init();
