// /задания/: ползунок шагает по заданиям; чем дороже, тем «горячее» цвет и свечение.
// Данные — из разметки списков (li[data-price]).
(() => {
  const meter = document.querySelector('[data-meter]');
  if (!meter) return;

  const HUE_COLD = 270; // сиреневый
  const HUE_HOT = 405; // через малиновый и красный к золотому (405 = 45°)
  const TIERS = [
    [0, 'Разминка'],
    [3000, 'Всерьёз'],
    [15000, 'Большие'],
    [66666, 'Легенды'],
  ];

  const read = (kind) => [...document.querySelectorAll(`[data-list="${kind}"] li[data-price]`)].map((el) => ({
    el,
    price: Number(el.dataset.price),
    title: el.querySelector('span').textContent.trim(),
  }));
  const tasks = read('task');
  const songs = read('song');
  if (!tasks.length) return;

  const range = meter.querySelector('.meter-range');
  const out = {
    amount: meter.querySelector('[data-amount]'),
    tier: meter.querySelector('[data-tier]'),
    task: meter.querySelector('[data-task]'),
    song: meter.querySelector('[data-song]'),
    donate: meter.querySelector('[data-donate-sum]'),
  };
  const fmt = (n) => n.toLocaleString('ru-RU').replace(/ | /g, ' ');

  const minLog = Math.log(tasks[0].price);
  const maxLog = Math.log(tasks[tasks.length - 1].price);
  const heatOf = (price) => Math.min(1, Math.max(0, (Math.log(price) - minLog) / (maxLog - minLog)));
  const hueOf = (heat) => Math.round(HUE_COLD + (HUE_HOT - HUE_COLD) * heat);

  // Цвет полоски у каждой строки списков — по её цене.
  [...tasks, ...songs].forEach((item) => {
    const t = heatOf(item.price);
    item.el.style.setProperty('--t', t.toFixed(3));
    item.el.style.setProperty('--h', String(hueOf(t)));
  });

  const tierOf = (price) => TIERS.filter(([from]) => price >= from).pop()[1];
  const songFor = (price) => songs.filter((s) => s.price <= price).pop();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flash = document.querySelector('.flash');
  const amountBox = meter.querySelector('.meter-amount');
  let shownAmount = tasks[0].price;
  let countFrame = 0;
  let lastTier = '';
  let heatNow = 0;

  // Сумма «докручивается» до новой, как счётчик на табло.
  function countTo(target) {
    cancelAnimationFrame(countFrame);
    if (reduceMotion) { shownAmount = target; out.amount.textContent = fmt(target); return; }
    const from = shownAmount;
    const start = performance.now();
    const DURATION = 380;
    const tick = (now) => {
      const k = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - k, 3);
      shownAmount = Math.round(from + (target - from) * eased);
      out.amount.textContent = fmt(shownAmount);
      if (k < 1) countFrame = requestAnimationFrame(tick);
    };
    countFrame = requestAnimationFrame(tick);
    amountBox.classList.remove('pop');
    void amountBox.offsetWidth;
    amountBox.classList.add('pop');
  }

  function levelUp() {
    if (reduceMotion) return;
    flash.classList.remove('go');
    meter.classList.remove('level-up');
    void flash.offsetWidth;
    flash.classList.add('go');
    meter.classList.add('level-up');
    if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
  }

  function show(index) {
    const item = tasks[index];
    const heat = heatOf(item.price);
    heatNow = heat;
    const root = document.body.style;
    root.setProperty('--heat', heat.toFixed(3));
    root.setProperty('--hue', String(hueOf(heat)));
    meter.style.setProperty('--heat', heat.toFixed(3));
    meter.style.setProperty('--hue', String(hueOf(heat)));
    meter.style.setProperty('--pos', (index / (tasks.length - 1)).toFixed(3));

    countTo(item.price);
    const tier = tierOf(item.price);
    if (lastTier && tier !== lastTier && tier !== TIERS[0][1]) levelUp();
    lastTier = tier;
    out.tier.textContent = tier;
    out.task.textContent = item.title;
    out.task.classList.remove('bump');
    void out.task.offsetWidth; // перезапуск анимации
    out.task.classList.add('bump');
    const song = songFor(item.price);
    out.song.innerHTML = '';
    if (song) {
      out.song.append('+ песня ');
      const b = document.createElement('b');
      b.textContent = `«${song.title}»`;
      out.song.append(b);
    }
    out.donate.textContent = `${fmt(item.price)} ₽`;
    range.setAttribute('aria-valuetext', `${fmt(item.price)} рублей — ${item.title}`);
    tasks.forEach((t, i) => t.el.classList.toggle('is-now', i === index));
  }

  const set = (index) => {
    const i = Math.min(tasks.length - 1, Math.max(0, index));
    range.value = String(i);
    show(i);
  };

  range.max = String(tasks.length - 1);
  range.addEventListener('input', () => show(Number(range.value)));
  meter.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => set(Number(range.value) + Number(btn.dataset.step)));
  });
  tasks.forEach((t, i) => t.el.addEventListener('click', () => {
    set(i);
    meter.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  set(0);
  if (!reduceMotion) startSparks(() => heatNow);
})();

// Искры на фоне: чем дороже задание (heat 0..1), тем их больше, быстрее и «теплее» цвет.
function startSparks(getHeat) {
  const canvas = document.querySelector('.sparks');
  const ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;
  const MAX_SPARKS = 140;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  const sparks = [];

  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const spawn = (heat) => ({
    x: Math.random() * w,
    y: h + 10,
    r: 0.8 + Math.random() * (1.2 + heat * 2.2),
    vy: 0.4 + Math.random() * (0.6 + heat * 2.6),
    vx: (Math.random() - 0.5) * 0.6,
    life: 1,
    hue: 270 + heat * 135 + (Math.random() - 0.5) * 30,
  });

  const frame = () => {
    const heat = getHeat();
    const target = Math.round(18 + heat * (MAX_SPARKS - 18));
    for (let n = 0; n < 3 && sparks.length < target; n += 1) {
      const s = spawn(heat);
      if (sparks.length < target * 0.6) s.y = Math.random() * h; // при росте «жары» искры появляются сразу по всему экрану
      sparks.push(s);
    }
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const s = sparks[i];
      s.y -= s.vy;
      s.x += s.vx + Math.sin(s.y / 40) * 0.3;
      s.life -= 0.0035 + s.vy * 0.0015;
      if (s.life <= 0 || s.y < -10) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = `hsla(${s.hue % 360}, 95%, 62%, ${s.life * (0.35 + heat * 0.5)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (sparks.length > target) sparks.splice(0, sparks.length - target);
    requestAnimationFrame(frame);
  };

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
}
