// tasks.html: калькулятор «что будет за твою сумму». Данные берутся из разметки (li[data-price][data-kind]).
(() => {
  const calc = document.querySelector('[data-calc]');
  if (!calc) return;

  const MIN = 200;
  const MAX = 250000;
  const START = 3000;
  const RANGE_STEPS = 1000;

  const input = calc.querySelector('#calc-amount');
  const range = calc.querySelector('.calc-range');
  const quick = [...calc.querySelectorAll('[data-amount]')];
  const countEl = calc.querySelector('[data-count]');
  const items = [...document.querySelectorAll('.price-list li[data-price]')].map((el) => ({
    el,
    price: Number(el.dataset.price),
    kind: el.dataset.kind,
    title: el.querySelector('span').textContent.trim(),
  }));

  const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ | /g, ' ');
  const parse = (s) => Math.min(Number(String(s).replace(/\D/g, '').slice(0, 9)) || 0, 999999999);

  // Логарифмическая шкала: и 200 ₽, и 222 222 ₽ помещаются на одном ползунке.
  const toRange = (amount) => {
    const a = Math.min(Math.max(amount, MIN), MAX);
    return Math.round((Math.log(a / MIN) / Math.log(MAX / MIN)) * RANGE_STEPS);
  };
  const fromRange = (pos) => {
    const raw = MIN * Math.pow(MAX / MIN, pos / RANGE_STEPS);
    const step = raw < 2000 ? 100 : raw < 20000 ? 500 : raw < 100000 ? 1000 : 5000;
    return Math.round(raw / step) * step;
  };

  const ofKind = (kind) => items.filter((i) => i.kind === kind);
  const best = (kind, amount) => ofKind(kind).filter((i) => i.price <= amount).sort((a, b) => b.price - a.price)[0];
  const next = (kind, amount) => ofKind(kind).filter((i) => i.price > amount).sort((a, b) => a.price - b.price)[0];

  function show(kind, amount) {
    const top = best(kind, amount);
    const up = next(kind, amount);
    calc.querySelector(`[data-best="${kind}"]`).textContent = top ? top.title : 'пока ничего';
    calc.querySelector(`[data-next="${kind}"]`).textContent = up
      ? `ещё ${fmt(up.price - amount)} ₽ — и «${up.title}»`
      : 'это максимум из списка';
    return top;
  }

  function render(amount) {
    const picks = [show('task', amount), show('song', amount)];
    document.body.classList.add('has-amount');
    const on = items.filter((i) => i.price <= amount).length;
    items.forEach((i) => {
      i.el.classList.toggle('is-on', i.price <= amount);
      i.el.classList.toggle('is-best', picks.includes(i));
    });
    countEl.textContent = on
      ? `Доступно ${on} из ${items.length} — подсвечено в списках ниже.`
      : `Минимальный заказ — ${fmt(MIN)} ₽.`;
    quick.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.amount) === amount)));
  }

  function set(amount, from) {
    if (from !== 'input') input.value = fmt(amount);
    if (from !== 'range') range.value = String(toRange(amount));
    render(amount);
  }

  input.addEventListener('input', () => {
    const amount = parse(input.value);
    const tail = input.value.length - (input.selectionStart ?? input.value.length);
    input.value = amount ? fmt(amount) : '';
    const pos = Math.max(0, input.value.length - tail);
    input.setSelectionRange(pos, pos);
    set(amount, 'input');
  });
  range.addEventListener('input', () => set(fromRange(Number(range.value)), 'range'));
  quick.forEach((b) => b.addEventListener('click', () => set(Number(b.dataset.amount))));

  set(START);
})();
