import { initPolyaGuide } from './polya-guide.js?v=4';
import { initStreamPlayer } from './stream-player.js?v=1';
import { initMoments } from './moments.js?v=4';
import { initAtlas } from './atlas.js?v=4';

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

initMoments({isMotionOff:()=>motionOff});
initAtlas({isMotionOff:()=>motionOff});

initStreamPlayer();

initPolyaGuide();
