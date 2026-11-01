// Twitch-панель «Задания»: ползунок по заданиям, цвет и искры зависят от цены.
// Сеть не используется: все данные — в разметке panel.html.
(() => {
  const HUE_COLD = 270;
  const HUE_HOT = 405; // сиреневый → малиновый → красный → золотой
  const TIERS = [[0, 'Разминка'], [3000, 'Всерьёз'], [15000, 'Большие'], [66666, 'Легенды']];
  const COUNT_MS = 380;

  const root = document.documentElement;
  const meter = document.querySelector('[data-meter]');
  const range = meter.querySelector('.meter-range');
  const amountBox = meter.querySelector('.meter-amount');
  const amountEl = meter.querySelector('[data-amount]');
  const tierEl = meter.querySelector('[data-tier]');
  const taskEl = meter.querySelector('[data-task]');
  const flash = document.querySelector('.flash');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tasks = [...document.querySelectorAll('[data-list="task"] li[data-price]')].map((el) => ({
    el,
    price: Number(el.dataset.price),
    title: el.querySelector('span').textContent.trim(),
  }));

  const fmt = (n) => n.toLocaleString('ru-RU').replace(/ | /g, ' ');
  const minLog = Math.log(tasks[0].price);
  const maxLog = Math.log(tasks[tasks.length - 1].price);
  const heatOf = (price) => (Math.log(price) - minLog) / (maxLog - minLog);
  const hueOf = (heat) => Math.round(HUE_COLD + (HUE_HOT - HUE_COLD) * heat);
  const tierOf = (price) => TIERS.filter(([from]) => price >= from).pop()[1];

  tasks.forEach((t) => {
    const heat = heatOf(t.price);
    t.el.style.setProperty('--t', heat.toFixed(3));
    t.el.style.setProperty('--h', String(hueOf(heat)));
  });

  let shown = tasks[0].price;
  let frame = 0;
  let lastTier = '';
  let heatNow = 0;

  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  function countTo(target) {
    cancelAnimationFrame(frame);
    if (reduceMotion) { shown = target; amountEl.textContent = fmt(target); return; }
    const from = shown;
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - start) / COUNT_MS);
      shown = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)));
      amountEl.textContent = fmt(shown);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    restart(amountBox, 'pop');
  }

  function show(index) {
    const item = tasks[index];
    heatNow = heatOf(item.price);
    root.style.setProperty('--heat', heatNow.toFixed(3));
    root.style.setProperty('--hue', String(hueOf(heatNow)));
    root.style.setProperty('--pos', (index / (tasks.length - 1)).toFixed(3));
    countTo(item.price);
    const tier = tierOf(item.price);
    if (lastTier && tier !== lastTier && tier !== TIERS[0][1] && !reduceMotion) {
      restart(flash, 'go');
      restart(meter, 'level-up');
    }
    lastTier = tier;
    tierEl.textContent = tier;
    taskEl.textContent = item.title;
    if (!reduceMotion) restart(taskEl, 'bump');
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
  meter.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => set(Number(range.value) + Number(b.dataset.step))));
  tasks.forEach((t, i) => t.el.addEventListener('click', () => {
    set(i);
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  // Twitch требует подключённый помощник расширений; без Twitch (предпросмотр) панель тоже работает.
  if (window.Twitch && window.Twitch.ext) window.Twitch.ext.onAuthorized(() => {});

  set(0);
  if (!reduceMotion) sparks(() => heatNow);

  function sparks(getHeat) {
    const canvas = document.querySelector('.sparks');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const MAX = 70;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const list = [];
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (heat) => ({
      x: Math.random() * w, y: h + 6,
      r: 0.7 + Math.random() * (1 + heat * 1.8),
      vy: 0.3 + Math.random() * (0.5 + heat * 2),
      vx: (Math.random() - 0.5) * 0.5,
      life: 1,
      hue: HUE_COLD + heat * (HUE_HOT - HUE_COLD) + (Math.random() - 0.5) * 30,
    });
    const step = () => {
      const heat = getHeat();
      const target = Math.round(10 + heat * (MAX - 10));
      for (let n = 0; n < 2 && list.length < target; n += 1) {
        const s = spawn(heat);
        if (list.length < target * 0.6) s.y = Math.random() * h;
        list.push(s);
      }
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const s = list[i];
        s.y -= s.vy; s.x += s.vx + Math.sin(s.y / 40) * 0.3;
        s.life -= 0.004 + s.vy * 0.0015;
        if (s.life <= 0 || s.y < -6) { list.splice(i, 1); continue; }
        ctx.fillStyle = `hsla(${s.hue % 360}, 95%, 62%, ${s.life * (0.35 + heat * 0.5)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      if (list.length > target) list.splice(0, list.length - target);
      requestAnimationFrame(step);
    };
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(step);
  }
})();
