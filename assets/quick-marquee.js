// Бегущая строка «Можно начать с этого»: размножает группу, пока строка не перекроет экран с запасом,
// и сдвигает ровно на ширину одной группы — поэтому справа не бывает пустоты.
// Кнопки-моменты в копиях передают нажатие оригиналу (у него обработчик moments.js).
const root = document.documentElement;
const vp = document.querySelector('.qm-viewport');
const track = vp && vp.querySelector('.qm-track');
const group = track && track.querySelector('.qm-group');
const motionOff = () => matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('reduce-motion');

function build() {
  track.querySelectorAll('.qm-group[data-clone]').forEach((n) => n.remove());
  track.classList.remove('is-running');
  if (motionOff()) return;
  const gw = group.getBoundingClientRect().width;
  if (!gw) return;
  const copies = Math.ceil(vp.clientWidth / gw) + 1;
  for (let i = 0; i < copies; i += 1) {
    const c = group.cloneNode(true);
    c.dataset.clone = '';
    c.setAttribute('aria-hidden', 'true');
    c.querySelectorAll('a').forEach((a, k) => {
      a.tabIndex = -1;
      a.dataset.qmIndex = String(k);
      a.removeAttribute('data-open-clip');
    });
    track.append(c);
  }
  track.style.setProperty('--qm-shift', `${-gw}px`);
  track.style.setProperty('--qm-dur', `${Math.max(24, gw / 45)}s`);
  track.classList.add('is-running');
}

if (vp && track && group) {
  track.addEventListener('click', (e) => {
    const a = e.target.closest('.qm-group[data-clone] a');
    if (!a) return;
    e.preventDefault();
    const original = group.querySelectorAll('a')[Number(a.dataset.qmIndex)];
    if (original) original.click();
  });
  let t = 0;
  const later = () => { clearTimeout(t); t = setTimeout(build, 150); };
  addEventListener('resize', later);
  new MutationObserver(later).observe(root, { attributes: true, attributeFilter: ['class'] });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
}
