// Бегущая строка «Чем живёт Поля»: размножает группу, пока строка не перекроет экран с запасом,
// и сдвигает ровно на ширину одной группы — поэтому справа не бывает пустоты.
const vp = document.querySelector('.qm-viewport');
const track = vp && vp.querySelector('.qm-track');
const group = track && track.querySelector('.qm-group');

function build() {
  track.querySelectorAll('.qm-group[data-clone]').forEach((n) => n.remove());
  track.classList.remove('is-running');
  const gw = group.getBoundingClientRect().width;
  if (!gw) return;
  const copies = Math.ceil(vp.clientWidth / gw) + 1;
  for (let i = 0; i < copies; i += 1) {
    const c = group.cloneNode(true);
    c.dataset.clone = '';
    c.setAttribute('aria-hidden', 'true');
    track.append(c);
  }
  track.style.setProperty('--qm-shift', `${-gw}px`);
  track.style.setProperty('--qm-dur', `${Math.max(24, gw / 45)}s`);
  track.classList.add('is-running');
}

if (vp && track && group) {
  let t = 0;
  const later = () => { clearTimeout(t); t = setTimeout(build, 150); };
  addEventListener('resize', later);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
}
