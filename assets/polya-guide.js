// разгон: ≥2.4 экрана и ≥2 главы за BURST_MS; запас по времени — на подвисания тяжёлой страницы на слабых телефонах
const BURST_MS = 4000;
const INPUT_GAP_MS = 3500;

export function shouldNudge(samples, viewport) {
  if (samples.length < 2 || viewport <= 0) return false;
  const first = samples[0], last = samples.at(-1);
  const elapsed = last.time - first.time;
  return elapsed >= 80 && elapsed <= BURST_MS && Math.abs(last.y - first.y) >= viewport * 2.4 && Math.abs(last.chapter - first.chapter) >= 2;
}

// Главы главной: по ним понимаем, где гость был до того, как начал быстро листать.
const chapters = [
  {id:'about',title:'Можно просто Поля'},
  {id:'what',title:'Что сегодня в эфире?'},
  {id:'interests',title:'Вне эфира'},
  {id:'moments',title:'Сохранённые моменты'},
  {id:'travel',title:'Куда занесло Полю'},
  {id:'together',title:'Кто в кадре вместе'},
  {id:'connect',title:'Увидимся на стриме'}
];
const SPOKEN = 'Куда-то торопишься?';
const MAX_PER_SESSION = 2;
const COOLDOWN_MS = 60000;

export function initPolyaGuide() {
  const dialog = document.querySelector('#polya-guide');
  if (!dialog || !dialog.showModal) return;
  const key = 'nedogon-polya-nudge-v2';
  let shown = 0, cooldownUntil = 0, skipFrom = null, rest = null, lastInputStamp = -Infinity, pendingTarget = null;
  try { shown = Number(sessionStorage.getItem(key)) || 0; } catch {}
  const resting = () => shown >= MAX_PER_SESSION || performance.now() < cooldownUntil;
  let samples = [], timer, typingTimer, buttonTimer, suppressUntil = performance.now() + 3000, lastInput = -Infinity;
  let oldOverflow = '', returnY = 0, restorePosition = true;
  const title = dialog.querySelector('.polya-spoken');
  const actions = dialog.querySelector('.polya-actions');
  const returnHint = dialog.querySelector('.polya-return');
  const motionOff = () => false; // анимации на сайте включены всегда
  const chapterIndex = () => chapters.reduce((current, chapter, i) => {
    const section = document.getElementById(chapter.id);
    return section && section.getBoundingClientRect().top < innerHeight * .6 ? i : current;
  }, -1);
  const busy = () => document.documentElement.classList.contains('boot-loading') || !!document.querySelector('dialog[open], .menu-toggle[aria-expanded="true"]') || [...document.querySelectorAll('video')].some(v => !v.paused && !v.ended);
  function stopTyping() { clearTimeout(typingTimer); clearTimeout(buttonTimer); }
  function revealActions() { actions.inert = false; actions.classList.add('ready'); }
  function speak() {
    const text = SPOKEN;
    title.textContent = '';
    actions.inert = true;
    actions.classList.remove('ready');
    if (motionOff()) { title.textContent = text; revealActions(); return; }
    let i = 0;
    function letter() {
      title.textContent = text.slice(0, ++i);
      if (i < text.length) typingTimer = setTimeout(letter, 58);
      else buttonTimer = setTimeout(revealActions, 280);
    }
    typingTimer = setTimeout(letter, 500);
  }
  // куда вернём: глава, на которой гость был до разгона, или самое начало
  function target() {
    const chapter = skipFrom && chapters[skipFrom.chapter];
    const section = chapter && document.getElementById(chapter.id);
    return section ? {section, label:`Вернёмся к «${chapter.title}»`} : {section:null, label:'Вернёмся в самое начало'};
  }
  function open(preview = false) {
    if (dialog.open || busy() || (!preview && resting())) return;
    if (!preview) { shown += 1; try { sessionStorage.setItem(key, String(shown)); } catch {} }
    returnY = scrollY;
    restorePosition = true;
    oldOverflow = document.body.style.overflow;
    returnHint.textContent = target().label;
    dialog.querySelector('.polya-portrait').src = 'assets/img/guide/polya-wait-v1.webp';
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    speak();
  }
  dialog.querySelector('.polya-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.polya-dismiss').addEventListener('click', () => dialog.close());
  dialog.querySelector('.polya-show').addEventListener('click', () => {
    pendingTarget = target();
    restorePosition = false; dialog.close();
  });
  dialog.addEventListener('close', () => {
    stopTyping(); document.body.style.overflow = oldOverflow;
    suppressUntil = performance.now() + 3500; samples = []; skipFrom = null;
    cooldownUntil = performance.now() + COOLDOWN_MS;
    if (restorePosition) window.scrollTo({top:returnY,behavior:'instant'});
    // прокрутка назад — только после снятия блокировки страницы, иначе браузер её гасит
    const goTo = pendingTarget; pendingTarget = null;
    if (goTo) requestAnimationFrame(() => {
      const behavior = motionOff() ? 'instant' : 'smooth';
      if (goTo.section) {
        goTo.section.scrollIntoView({behavior});
        goTo.section.setAttribute('tabindex','-1'); goTo.section.focus({preventScroll:true});
      } else window.scrollTo({top:0, behavior});
    });
  });
  window.addEventListener('motionchange', () => { if(dialog.open) { stopTyping(); title.textContent = SPOKEN; revealActions(); } });
  // где гость стоял до разгона: позиция в момент первого жеста после паузы дольше секунды.
  // Берём метку времени самого жеста — подвисание тяжёлой страницы посреди разгона её не сдвинет.
  const READ_PAUSE_MS = 1000;
  function input(event) {
    const stamp = event && event.timeStamp ? event.timeStamp : performance.now();
    if (!dialog.open && stamp - lastInputStamp > READ_PAUSE_MS) {
      rest = {y:scrollY, chapter:chapterIndex()};
      samples = [{y:rest.y, time:stamp, chapter:rest.chapter}]; // разгон считаем от первого жеста
    }
    lastInputStamp = stamp; lastInput = performance.now();
  }
  window.addEventListener('wheel', input, {passive:true});
  window.addEventListener('touchstart', input, {passive:true});
  window.addEventListener('touchmove', input, {passive:true});
  window.addEventListener('keydown', event => {
    if (!event.target.closest('input,textarea,select,[contenteditable="true"]') && ['PageDown','PageUp','ArrowDown','ArrowUp',' ','End','Home'].includes(event.key)) input(event);
  });
  document.addEventListener('click', event => {
    if (event.target.closest('a[href*="#"], .menu-toggle, .atlas-preview, [data-open-clip]')) {
      suppressUntil = performance.now() + 3500; samples = [];
    }
  }, true);
  window.addEventListener('hashchange', () => { suppressUntil = performance.now() + 3500; samples = []; });
  rest = {y:scrollY, chapter:chapterIndex()};
  window.addEventListener('scroll', () => {
    const now = performance.now();
    if (resting() || now < suppressUntil || now - lastInput > INPUT_GAP_MS || busy()) { samples = []; return; }
    samples = samples.filter(sample => now - sample.time <= BURST_MS);
    samples.push({y:scrollY,time:now,chapter:chapterIndex()});
    clearTimeout(timer);
    const qualifies = shouldNudge(samples, innerHeight);
    const from = rest;
    timer = setTimeout(() => {
      if (qualifies && !document.hidden && performance.now() >= suppressUntil) { skipFrom = from; open(); }
      samples = [];
    }, 700);
  }, {passive:true});
  window.addEventListener('site:ready', () => { suppressUntil = performance.now() + 3000; if(new URLSearchParams(location.search).get('polya') === 'preview') setTimeout(() => open(true), 700); }, {once:true});
  if (!document.documentElement.classList.contains('boot-loading') && new URLSearchParams(location.search).get('polya') === 'preview') setTimeout(() => open(true), 900);
}
