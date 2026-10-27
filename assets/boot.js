// Independent of the main app/Three.js module graph, so slow dependencies cannot trap the intro.
(() => {
  const root = document.documentElement;
  const finish = window.finishSiteBoot;
  if (!finish || !root.classList.contains('boot-loading')) return;
  const path = document.body.dataset.bootImage || (matchMedia('(max-width:780px)').matches ? 'assets/img/hero.webp' : 'assets/images/portrait-room.webp');
  const portrait = new Image();
  portrait.fetchPriority = 'high';
  const imageReady = new Promise(resolve => {
    portrait.onload = () => {
      const decoded = portrait.decode?.();
      if(decoded) decoded.catch(()=>{}).finally(resolve); else resolve();
    };
    portrait.onerror = resolve;
    portrait.src = path;
    if(portrait.complete && portrait.naturalWidth) resolve();
  });
  const fontsReady = document.fonts ? Promise.race([document.fonts.load('500 16px Manrope'),new Promise(resolve=>setTimeout(resolve,2200))]) : Promise.resolve();
  Promise.allSettled([imageReady,fontsReady]).then(()=>{
    root.classList.toggle('hero-image-ready',portrait.naturalWidth>0);
    finish();
  });
})();
