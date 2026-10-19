// GA4 measures page views and foreground engagement automatically.
(() => {
  if (location.hostname !== 'onebe-create.com' || location.protocol !== 'https:') return;
  const measurementId = 'G-21K44SV7K0';
  const withoutParameters = value => {
    try { const parsed = new URL(value); return parsed.origin + parsed.pathname; }
    catch { return ''; }
  };
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    page_location: location.origin + location.pathname,
    page_referrer: withoutParameters(document.referrer),
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  document.addEventListener?.('click', event => {
    const anchor=event.target.closest?.('a[href]');
    if(!anchor)return;
    let target;try{target=new URL(anchor.href,location.href);}catch{return;}
    if(target.origin!==location.origin||target.pathname!=='/contact/'||location.pathname==='/contact/')return;
    const serviceMap={'ロゴ制作':'logo','名刺制作':'business_card','チラシ・ポスター制作':'flyer'};
    window.gtag('event','contact_click',{service_type:serviceMap[target.searchParams.get('topic')]||'other',source_path:location.pathname,transport_type:'beacon'});
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);
})();
