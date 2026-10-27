import { initPolyaGuide } from './polya-guide.js?v=9';
import { initStreamPlayer } from './stream-player.js?v=1';
import { initMoments } from './moments.js?v=4';
import { initAtlas } from './atlas.js?v=4';

const root = document.documentElement;
// Анимации включены всегда — так решил владелец сайта: без кнопки паузы и без оглядки на настройку «уменьшить движение».
const motionOff = false;
try { localStorage.removeItem('nedogon-motion'); } catch { /* Storage may be disabled. */ }
root.classList.remove('reduce-motion');
root.classList.add('js-motion');

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
