// Clarity is optional. No GTM/Clarity request is made before an affirmative choice.
(() => {
  if (window.__onebeHeatmapUI) return;
  window.__onebeHeatmapUI = true;
  const key = 'onebe-heatmap-choice-v1';
  const lifetime = 180 * 86400000;
  const readChoice = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return saved && ['yes', 'no'].includes(saved.choice) && saved.until > Date.now() ? saved.choice : null;
    } catch { return null; }
  };
  const eligible = () => {
    if (location.hostname !== 'onebe-create.com' || location.protocol !== 'https:') return false;
    if (/^\/(contact|thanks)(\/|$)/.test(location.pathname)) return false;
    // Do not send parameter-bearing entry URLs or referrers to the heatmap service.
    if (location.search || location.hash) return false;
    try { if (document.referrer && new URL(document.referrer).search) return false; } catch { return false; }
    return true;
  };
  let loaded = false;
  function start() {
    if (loaded || readChoice() !== 'yes' || !eligible()) return;
    loaded = true;
    document.body.setAttribute('data-clarity-mask', 'True');
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({'gtm.start': Date.now(), event: 'gtm.js'});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-P8T4FL8D';
    document.head.appendChild(script);
    window.dataLayer.push({event: 'onebe_clarity_allowed'});
  }
  const panel = document.createElement('section');
  panel.className = 'onebe-heatmap-choice';
  panel.setAttribute('aria-label', 'サイト改善のための利用状況の記録');
  panel.innerHTML = '<p><strong>サイト改善へのご協力</strong><br>Microsoft Clarityでクリックやスクロールなどの操作を記録して、使いやすさの改善に役立てます。許可しなくてもサイトをご利用いただけます。</p><a href="/privacy/">詳しい取り扱い</a><div class="onebe-heatmap-actions"><button type="button" data-choice="no">許可しない</button><button type="button" data-choice="yes">許可する</button></div><p class="onebe-heatmap-status" role="status"></p>';
  panel.hidden = true;
  document.body.appendChild(panel);
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'onebe-heatmap-settings';
  settings.textContent = 'ヒートマップの利用設定';
  const footer = document.querySelector('.site-footer');
  if (footer) footer.appendChild(settings);
  else document.body.appendChild(settings);
  function show(focus = false) {
    panel.hidden = false;
    const choice = readChoice();
    panel.querySelector('[role="status"]').textContent = choice === 'yes' ? '現在：許可しています。変更はいつでも可能です。' : choice === 'no' ? '現在：許可していません。' : '';
    if (focus) panel.querySelector('button').focus();
  }
  settings.addEventListener('click', () => show(true));
  for (const button of panel.querySelectorAll('[data-choice]')) {
    button.addEventListener('click', () => {
      const choice = button.dataset.choice;
      try { localStorage.setItem(key, JSON.stringify({choice, until: Date.now() + lifetime})); }
      catch { panel.querySelector('[role="status"]').textContent = '設定を保存できないため、ヒートマップの記録は開始しません。'; return; }
      panel.hidden = true;
      settings.focus({preventScroll: true});
      if (choice === 'no' && loaded) {
        if (typeof window.clarity === 'function') window.clarity('consentv2', {analytics_Storage: 'denied', ad_Storage: 'denied'});
        // Reload removes the recorder. Consent API alone would still allow limited tracking.
        location.reload();
      } else start();
    });
  }
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    if (loaded && readChoice() !== 'yes') location.reload();
  });
  if (readChoice() === null && !/^\/(contact|thanks)(\/|$)/.test(location.pathname)) show();
  start();
})();
