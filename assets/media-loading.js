export function localImageKey(source, base) {
  try {
    const url = new URL(source, base), page = new URL(base);
    return url.origin === page.origin ? decodeURIComponent(url.pathname).replace(/^\//, '') : null;
  } catch { return null; }
}

let previewRequest;
function previewMap() {
  return previewRequest ||= fetch('assets/image-previews.json').then(r=>r.ok?r.json():{}).catch(()=>({}));
}
export function setPosterBackground(element, source) {
  element.dataset.posterSource = source;
  element.style.backgroundImage = `url("${source}")`;
  previewMap().then(previews => {
    const tiny = previews[localImageKey(source,location.href)];
    if(tiny && element.dataset.posterSource === source) element.style.backgroundImage = `url("${source}"),url("${tiny}")`;
  });
}

export function initImageLoading() {
  let previews = {};
  const states = new WeakMap();
  const errorImage = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="#222024"/><text x="300" y="215" text-anchor="middle" fill="#f2eee6" font-family="Arial,sans-serif" font-size="21">Фото не загрузилось</text><text x="300" y="250" text-anchor="middle" fill="#d5b0ef" font-family="Arial,sans-serif" font-size="16">Нажми, чтобы повторить</text></svg>');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.loading = 'eager'; observer.unobserve(entry.target); }
    });
  }, {rootMargin:navigator.connection?.saveData ? '200px' : '1000px'});
  function preview(img, state) {
    const tiny = previews[localImageKey(state.source, location.href)];
    if (tiny && !state.loaded && !state.failed) img.style.backgroundImage = `url("${tiny}")`;
  }
  function watch(img) {
    if (!(img instanceof HTMLImageElement)) return;
    const source = img.getAttribute('src');
    if (!source || source.startsWith('data:') || /\.svg(?:[?#]|$)/i.test(source)) return;
    const previous = states.get(img);
    if (previous?.source === source) return;
    previous?.cleanup();
    if(previous?.action) { if(previous.oldLabel === null) previous.action.removeAttribute('aria-label'); else previous.action.setAttribute('aria-label',previous.oldLabel); }
    const state = {source,loaded:false,failed:false,cleanup:()=>{}};
    states.set(img,state);
    img.classList.add('image-loading'); img.classList.remove('image-failed','image-ready');
    preview(img,state);
    const complete = () => {
      if (states.get(img) !== state || state.failed) return;
      state.loaded = true;
      img.classList.remove('image-loading','image-failed');
      img.classList.add('image-ready');
      img.style.backgroundImage = '';
    };
    const failed = () => {
      if (states.get(img) !== state || state.failed) return;
      state.failed = true;
      state.cleanup();
      img.classList.remove('image-loading'); img.classList.add('image-failed');
      img.style.backgroundImage = '';
      img.src = errorImage;
      img.title = 'Повторить загрузку фотографии';
      // An image inside a link/button can be retried with the same keyboard action.
      const action = img.closest('a,button');
      if (action) { state.action = action; state.oldLabel = action.getAttribute('aria-label'); action.setAttribute('aria-label','Повторить загрузку фотографии'); }
    };
    img.addEventListener('load',complete);img.addEventListener('error',failed);
    state.cleanup = () => {img.removeEventListener('load',complete);img.removeEventListener('error',failed);observer.unobserve(img);};
    if (img.complete && img.naturalWidth) complete();
    else if (img.complete) failed();
    else observer.observe(img);
  }
  function scan(root) { if(root instanceof HTMLImageElement) watch(root); root.querySelectorAll?.('img').forEach(watch); }
  scan(document);
  new MutationObserver(records => records.forEach(record => {
    if(record.type === 'attributes') watch(record.target);
    else record.addedNodes.forEach(scan);
  })).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
  document.addEventListener('click',event => {
    const img = event.target.closest?.('img.image-failed') || event.target.closest?.('a,button')?.querySelector('img.image-failed');
    const state = img && states.get(img);
    if(!state?.failed) return;
    event.preventDefault();event.stopImmediatePropagation();
    if(state.action) { if(state.oldLabel === null) state.action.removeAttribute('aria-label'); else state.action.setAttribute('aria-label',state.oldLabel); }
    states.delete(img);img.removeAttribute('title');img.src = state.source;watch(img);
  },true);
  previewMap().then(data=>{
    previews=data;document.querySelectorAll('img.image-loading').forEach(img=>{const state=states.get(img);if(state)preview(img,state);});
  }).catch(()=>{});
}

if (typeof document !== 'undefined') initImageLoading();
