export function shouldNudge(samples, viewport) {
  if (samples.length < 2 || viewport <= 0) return false;
  const first = samples[0], last = samples.at(-1);
  const elapsed = last.time - first.time;
  return elapsed >= 80 && elapsed <= 2600 && Math.abs(last.y - first.y) >= viewport * 2.4 && Math.abs(last.chapter - first.chapter) >= 2;
}

const chapters = [
  {id:'about',title:'Можно просто Поля',text:'Знакомство и та самая фамилия.',image:'assets/photos/polina-stream.webp'},
  {id:'what',title:'Что сегодня в эфире?',text:'Кукинги, гости и большие проекты.',image:'assets/img/formats/cooking.webp'},
  {id:'interests',title:'Вне эфира',text:'Фестивали, монтаж и сноуборд.',image:'assets/img/formats/sport.webp'},
  {id:'moments',title:'Сохранённые моменты',text:'Бассейн-корабль и водная полоса.',image:'assets/photos/video-captain.jpg'},
  {id:'travel',title:'Куда занесло Полю',text:'Глобус и истории путешествий.',image:'assets/countries/id.webp'},
  {id:'together',title:'Кто в кадре вместе',text:'Гости и совместные приключения.',image:'assets/photos/video-dubai.jpg'},
  {id:'connect',title:'Увидимся на стриме',text:'Все её каналы в одном месте.',image:'assets/photos/polina-flowers.webp'}
];

export function initPolyaGuide() {
  const dialog = document.querySelector('#polya-guide');
  if (!dialog || !dialog.showModal) return;
  const key = 'nedogon-polya-nudge-v1';
  let used = false;
  try { used = sessionStorage.getItem(key) === 'shown'; } catch {}
  let samples = [], timer, typingTimer, buttonTimer, suppressUntil = performance.now() + 3000, lastInput = -Infinity;
  let oldOverflow = '', returnY = 0, restorePosition = true;
  const title = dialog.querySelector('.polya-spoken');
  const actions = dialog.querySelector('.polya-actions');
  const choices = dialog.querySelector('.polya-chapters');
  const motionOff = () => document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapterIndex = () => chapters.reduce((current, chapter, i) => {
    const section = document.getElementById(chapter.id);
    return section && section.getBoundingClientRect().top < innerHeight * .6 ? i : current;
  }, -1);
  const busy = () => document.documentElement.classList.contains('boot-loading') || !!document.querySelector('dialog[open], .menu-toggle[aria-expanded="true"]') || [...document.querySelectorAll('video')].some(v => !v.paused && !v.ended);
  function stopTyping() { clearTimeout(typingTimer); clearTimeout(buttonTimer); }
  function revealActions() { actions.inert = false; actions.classList.add('ready'); }
  function speak() {
    const text = 'Погоди, не догоняю.';
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
  function open(preview = false) {
    if (dialog.open || busy() || (!preview && used)) return;
    used = true;
    try { sessionStorage.setItem(key, 'shown'); } catch {}
    returnY = scrollY;
    restorePosition = true;
    oldOverflow = document.body.style.overflow;
    dialog.classList.remove('choosing');
    choices.hidden = true;
    dialog.querySelector('.polya-portrait').src = 'assets/img/guide/polya-wait-v1.webp';
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    speak();
  }
  dialog.querySelector('.polya-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.polya-dismiss').addEventListener('click', () => dialog.close());
  dialog.querySelector('.polya-show').addEventListener('click', () => {
    stopTyping();
    dialog.classList.add('choosing');
    choices.hidden = false;
    choices.replaceChildren();
    // These are suggestions, never claims that the visitor has read or skipped a section.
    for (const chapter of chapters) {
      const link = document.createElement('a');
      link.href = '#' + chapter.id;
      const img = document.createElement('img'); img.src = chapter.image; img.alt = ''; img.loading = 'lazy';
      const copy = document.createElement('span');
      const heading = document.createElement('strong'); heading.textContent = chapter.title;
      const description = document.createElement('small'); description.textContent = chapter.text;
      copy.append(heading, description); link.append(img, copy);
      link.addEventListener('click', event => {
        event.preventDefault(); restorePosition = false; dialog.close(); suppressUntil = performance.now() + 3500;
        const section = document.getElementById(chapter.id);
        history.pushState(null, '', link.hash);
        section.scrollIntoView({behavior:motionOff() ? 'instant' : 'smooth'});
        section.setAttribute('tabindex','-1'); section.focus({preventScroll:true});
      });
      choices.append(link);
    }
    choices.querySelector('a')?.focus();
  });
  dialog.addEventListener('close', () => {
    stopTyping(); document.body.style.overflow = oldOverflow;
    suppressUntil = performance.now() + 3500; samples = [];
    if (restorePosition) window.scrollTo({top:returnY,behavior:'instant'});
  });
  window.addEventListener('motionchange', () => { if(dialog.open) { stopTyping(); title.textContent = 'Погоди, не догоняю.'; revealActions(); } });
  function input() { lastInput = performance.now(); }
  window.addEventListener('wheel', input, {passive:true});
  window.addEventListener('touchmove', input, {passive:true});
  window.addEventListener('keydown', event => {
    if (!event.target.closest('input,textarea,select,[contenteditable="true"]') && ['PageDown','PageUp','ArrowDown','ArrowUp',' '].includes(event.key)) input();
  });
  document.addEventListener('click', event => {
    if (event.target.closest('a[href*="#"], .menu-toggle, .atlas-preview, [data-open-clip]')) {
      suppressUntil = performance.now() + 3500; samples = [];
    }
  }, true);
  window.addEventListener('hashchange', () => { suppressUntil = performance.now() + 3500; samples = []; });
  window.addEventListener('scroll', () => {
    const now = performance.now();
    if (used || now < suppressUntil || now - lastInput > 2200 || busy()) { samples = []; return; }
    samples = samples.filter(sample => now - sample.time <= 2600);
    samples.push({y:scrollY,time:now,chapter:chapterIndex()});
    clearTimeout(timer);
    const qualifies = shouldNudge(samples, innerHeight);
    timer = setTimeout(() => { if (qualifies && !document.hidden && performance.now() >= suppressUntil) open(); samples = []; }, 700);
  }, {passive:true});
  window.addEventListener('site:ready', () => { suppressUntil = performance.now() + 3000; if(new URLSearchParams(location.search).get('polya') === 'preview') setTimeout(() => open(true), 700); }, {once:true});
  if (!document.documentElement.classList.contains('boot-loading') && new URLSearchParams(location.search).get('polya') === 'preview') setTimeout(() => open(true), 900);
}
