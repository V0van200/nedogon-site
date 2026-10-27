import { places } from './travel-data.js';

const root = document.documentElement;
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motionOff = systemMotion.matches;
try { motionOff ||= localStorage.getItem('nedogon-motion') === 'off'; } catch { /* Storage may be disabled. */ }
const motionButton = document.querySelector('.motion-toggle');
function syncMotion() {
  root.classList.toggle('reduce-motion', motionOff);
  root.classList.toggle('js-motion', !motionOff);
  motionButton.setAttribute('aria-pressed', String(motionOff));
  const label = motionOff ? 'Включить анимации' : 'Отключить анимации';
  motionButton.title = label;
  motionButton.querySelector('.sr-only').textContent = label;
  motionButton.querySelector('.motion-icon').textContent = motionOff ? '▶' : 'Ⅱ';
  window.dispatchEvent(new CustomEvent('motionchange', {detail: {disabled:motionOff}}));
}
syncMotion();
motionButton.addEventListener('click', () => {
  motionOff = !motionOff;
  try { localStorage.setItem('nedogon-motion', motionOff ? 'off' : 'on'); } catch { /* Optional preference. */ }
  syncMotion();
});
systemMotion.addEventListener('change', e => { motionOff = e.matches; syncMotion(); });

const reveals = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); reveals.unobserve(entry.target); } });
}, {threshold:.08, rootMargin:'0px 0px -20px 0px'});
document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = `${Math.min(i % 3, 2) * 65}ms`; reveals.observe(el); });

const header = document.querySelector('.site-header');
const progress = document.querySelector('.reading-progress');
const room = document.querySelector('.hero-room');
room.addEventListener('animationend', () => { room.style.animation = 'none'; updateScroll(); }, {once:true});
let scrollQueued = false;
function updateScroll() {
  scrollQueued = false;
  header.classList.toggle('is-scrolled', scrollY > 110);
  const distance = root.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${distance > 0 ? scrollY / distance : 0})`;
  if (!motionOff && scrollY < innerHeight) room.style.transform = `scale(1.045) translateY(${Math.min(scrollY * .13,100)}px)`;
}
addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, {passive:true});
updateScroll();

const menu = document.querySelector('#mobile-nav');
const menuButton = document.querySelector('.menu-toggle');
function closeMenu() { menu.classList.remove('open'); menu.inert = true; menuButton.setAttribute('aria-expanded','false'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menu.classList.toggle('open',open); menu.inert = !open; menuButton.setAttribute('aria-expanded',String(open)); });
menu.querySelectorAll('a').forEach(a => a.addEventListener('click',closeMenu));
addEventListener('keydown',e => { if (e.key === 'Escape') closeMenu(); });
matchMedia('(min-width: 781px)').addEventListener('change',e => { if(e.matches)closeMenu(); });
const sectionObserver = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) document.querySelectorAll('.site-header nav a').forEach(a => a.classList.toggle('active',a.hash === `#${e.target.id}`)); }), {rootMargin:'-20% 0px -60% 0px'});
document.querySelectorAll('main>section[id]').forEach(s => sectionObserver.observe(s));

const dialog = document.querySelector('#sources-dialog');
document.querySelector('.sources-button').addEventListener('click',() => dialog.showModal());
dialog.querySelector('.dialog-close').addEventListener('click',() => dialog.close());
dialog.addEventListener('click', e => { const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)dialog.close(); });

let currentPlaces = [...places];
let selectedId = 'bali';
let globeAPI;
const list = document.querySelector('#place-list');
const story = document.querySelector('#travel-story');
function renderPlaces() {
  list.innerHTML = currentPlaces.map(p => `<button class="place-button${p.id === selectedId ? ' active':''}" data-place="${p.id}" aria-pressed="${p.id === selectedId}">${p.name}</button>`).join('');
  list.querySelectorAll('button').forEach(b => b.addEventListener('click',() => selectPlace(b.dataset.place)));
  document.querySelector('#place-count').textContent = currentPlaces.length;
  document.querySelector('#country-count').textContent = new Set(currentPlaces.map(p => p.code)).size;
}
function selectPlace(id, fromGlobe = false) {
  const p = currentPlaces.find(p => p.id === id);
  if (!p) return;
  selectedId = id;
  const cover = p.image ? `<div class="story-image"><img src="${p.image}" alt="${p.imageAlt}" width="600" height="400"><span class="story-type">${p.type}</span><span class="image-credit">${p.imageCredit}</span></div>` : `<div class="story-image map-cover"><span class="cover-code" aria-hidden="true">${p.code}</span><span class="cover-country">${p.country}</span><span class="story-type">${p.type}</span><span class="cover-coordinates">${Math.abs(p.lat).toFixed(1)}° ${p.lat < 0 ? 'S':'N'} / ${Math.abs(p.lon).toFixed(1)}° E</span></div>`;
  story.innerHTML = `${cover}<div class="story-body"><div class="story-location"><h3>${p.name}</h3><span class="story-flag">${p.code}</span></div><p class="story-date">${p.date}</p><h4>${p.title}</h4><p>${p.text}</p><div class="story-footer"><div><a href="${p.url}" target="_blank" rel="noopener noreferrer">${p.url.includes('youtube') ? 'Смотреть влог':'Пост Полины'} ↗</a>${p.extraUrl ? `<a class="extra-source" href="${p.extraUrl}" target="_blank" rel="noopener noreferrer">Ещё источник ↗</a>`:''}<span class="story-precision">${p.precision}</span></div><div class="story-nav"><button type="button" data-step="-1" aria-label="Предыдущее место">←</button><button type="button" data-step="1" aria-label="Следующее место">→</button></div></div></div>`;
  story.classList.remove('story-enter');
  void story.offsetWidth;
  story.classList.add('story-enter');
  story.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => { const i = currentPlaces.findIndex(x => x.id === selectedId); selectPlace(currentPlaces[(i + Number(b.dataset.step) + currentPlaces.length) % currentPlaces.length].id); }));
  list.querySelectorAll('button').forEach(b => { const active = b.dataset.place === id; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); });
  globeAPI?.select(id, !fromGlobe);
}
renderPlaces();
selectPlace(selectedId);
document.querySelectorAll('[data-year]').forEach(button => button.addEventListener('click', () => {
  const year = button.dataset.year;
  currentPlaces = year === 'all' ? [...places] : places.filter(p => p.years.includes(Number(year)));
  if (!currentPlaces.some(p => p.id === selectedId)) selectedId = currentPlaces[0].id;
  document.querySelectorAll('[data-year]').forEach(b => { const active = b === button; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); });
  globeAPI?.filter(currentPlaces.map(p => p.id));
  renderPlaces(); selectPlace(selectedId);
}));

const atlasObserver = new IntersectionObserver(async entries => {
  if(!entries.some(e => e.isIntersecting)) return;
  atlasObserver.disconnect();
  try {
    const {createGlobe} = await import('./globe.js');
    globeAPI = await createGlobe(document.querySelector('#globe'), places, id => selectPlace(id,true), motionOff);
    globeAPI.filter(currentPlaces.map(p => p.id));
    globeAPI.select(selectedId,true);
    document.querySelector('.globe-shell').classList.add('globe-ready');
    document.querySelector('#globe-status').textContent = 'Потяни, чтобы вращать · нажми на точку';
  } catch (error) {
    document.querySelector('#globe-status').textContent = 'Выбирай истории в списке под картой';
    document.querySelector('.globe-spin').hidden = true;
    console.info('Globe fallback:',error.message);
  }
}, {rootMargin:'400px'});
atlasObserver.observe(document.querySelector('#travel'));
