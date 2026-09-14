(() => {
  const dialog = document.getElementById('intro-loader');
  if (!dialog) return;
  let resolveReady;
  window.onebeIntroReady = new Promise(resolve => { resolveReady = resolve; });
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'onebe-intro-v2';
  const bypass = () => { dialog.remove(); resolveReady(); };

  try {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (motion.matches || navigator.connection?.saveData || document.hidden ||
        navigation?.type === 'back_forward' || sessionStorage.getItem(key)) {
      bypass();
      return;
    }
    sessionStorage.setItem(key, 'seen');
  } catch {
    // If session storage is unavailable, keep every page directly accessible.
    bypass();
    return;
  }

  const video = dialog.querySelector('video');
  const skip = dialog.querySelector('button');
  const events = new AbortController();
  const options = {signal: events.signal};
  let finished = false, stallTimer, maximumTimer;

  function finish(reason, immediate = false) {
    if (finished) return;
    finished = true;
    events.abort();
    clearTimeout(stallTimer);
    clearTimeout(maximumTimer);
    video.pause();

    const reveal = () => {
      if (dialog.open) dialog.close();
      document.documentElement.classList.remove('intro-active');
      video.removeAttribute('src');
      video.load();
      dialog.remove();
      resolveReady();
      if (reason === 'skip') requestAnimationFrame(() =>
        document.querySelector('.site-header .brand')?.focus({preventScroll: true}));
    };
    if (immediate || motion.matches || !dialog.open) reveal();
    else {
      dialog.classList.add('is-leaving');
      setTimeout(reveal, 350);
    }
  }

  function allowBriefWait(milliseconds = 1800) {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => finish('timeout', true), milliseconds);
  }

  skip.addEventListener('click', () => finish('skip'), options);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    finish('skip', true);
  }, options);
  dialog.addEventListener('close', () => finish('closed', true), options);
  video.addEventListener('ended', () => finish('ended'), options);
  video.addEventListener('error', () => finish('error', true), options);
  video.addEventListener('playing', () => clearTimeout(stallTimer), options);
  video.addEventListener('waiting', () => allowBriefWait(), options);
  video.addEventListener('stalled', () => allowBriefWait(), options);
  motion.addEventListener('change', () => { if (motion.matches) finish('reduced-motion', true); }, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish('hidden', true); }, options);
  window.addEventListener('pagehide', () => finish('navigation', true), options);

  try {
    dialog.showModal();
    document.documentElement.classList.add('intro-active');
    allowBriefWait(2500);
    maximumTimer = setTimeout(() => finish('timeout', true), 12500);
    video.muted = true;
    video.playsInline = true;
    video.src = video.dataset.src;
    video.play().catch(() => finish('autoplay-blocked', true));
  } catch {
    finish('unsupported', true);
  }
})();
