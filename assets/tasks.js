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

  function show(index) {
    const item = tasks[index];
    const heat = heatOf(item.price);
    const root = document.body.style;
    root.setProperty('--heat', heat.toFixed(3));
    root.setProperty('--hue', String(hueOf(heat)));
    meter.style.setProperty('--heat', heat.toFixed(3));
    meter.style.setProperty('--hue', String(hueOf(heat)));
    meter.style.setProperty('--pos', (index / (tasks.length - 1)).toFixed(3));

    out.amount.textContent = fmt(item.price);
    out.tier.textContent = tierOf(item.price);
    out.task.textContent = item.title;
    out.task.classList.remove('bump');
    void out.task.offsetWidth; // перезапуск анимации
    out.task.classList.add('bump');
    const song = songFor(item.price);
    out.song.innerHTML = '';
    if (song) {
      out.song.append('А донат на эту сумму включит песню ');
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
})();
