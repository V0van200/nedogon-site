export const streamClips = [
  { id: 'sneeze', title: 'Чихнула на весь мир', slug: 'SpinelessConcernedLlamaM4xHeh-8yscuBx0g2pLTNtC', source: 'https://t.me/NEDOGONPOLYAA/7186' },
  { id: 'gym', title: 'Два типа людей в зале', slug: 'NaiveSuccessfulSandstormDancingBanana-gJbI1Syd6uMeiobJ', source: 'https://t.me/NEDOGONPOLYAA/7186' },
  { id: 'snow', title: 'Прыгаем по сугробам', slug: 'CharmingCovertPartridgeCoolCat-urQxnQeo1jptEXny', source: 'https://t.me/NEDOGONPOLYAA/8681' }
];

export function twitchEmbedUrl(id, parent) {
  if (!parent || !/^[a-z0-9.-]+$/i.test(parent)) throw new Error('Invalid parent hostname');
  const clip = streamClips.find(item => item.id === id);
  if (id !== 'channel' && !clip) throw new Error('Unknown clip');
  const url = new URL(clip ? 'https://clips.twitch.tv/embed' : 'https://player.twitch.tv/');
  url.searchParams.set(clip ? 'clip' : 'channel', clip ? clip.slug : 'nedogonpolya');
  url.searchParams.set('parent', parent);
  url.searchParams.set('autoplay', 'false');
  return url.href;
}

export function initStreamPlayer() {
  const dialog = document.querySelector('#stream-player');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const mount = dialog.querySelector('.stream-player-mount');
  const title = dialog.querySelector('#stream-player-title');
  const external = dialog.querySelector('.stream-player-external');
  const notice = dialog.querySelector('.stream-player-notice');
  let oldOverflow = '';
  document.querySelectorAll('[data-stream-media]').forEach(link => {
    link.addEventListener('click', event => {
      const id = link.dataset.streamMedia;
      const clip = streamClips.find(item => item.id === id);
      if (id !== 'channel' && !clip) return;
      event.preventDefault();
      title.textContent = clip ? clip.title : 'Канал Полины';
      external.href = link.href;
      mount.replaceChildren();
      mount.hidden = false;
      oldOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      // Twitch requires a player at least 400 × 300 px. Keep narrower screens usable.
      const canEmbed = mount.getBoundingClientRect().width >= 400;
      notice.hidden = canEmbed;
      mount.hidden = !canEmbed;
      if (!canEmbed) return;
      const frame = document.createElement('iframe');
      frame.src = twitchEmbedUrl(id, location.hostname);
      frame.title = clip ? `Twitch — ${clip.title}` : 'Трансляция NEDOGONPOLYA на Twitch';
      frame.allow = 'fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      mount.append(frame);
    });
  });
  dialog.querySelector('.stream-player-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    mount.replaceChildren();
    document.body.style.overflow = oldOverflow;
  });
}
