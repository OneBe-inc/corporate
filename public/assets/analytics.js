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
  let leadSent = false;
  window.onebeTrackLead = () => {
    if (leadSent || location.pathname !== '/contact/confirm/') return;
    leadSent = true;
    window.gtag('event', 'generate_lead', {
      send_to: measurementId,
      form_id: 'contact',
      page_location: location.origin + location.pathname,
      page_referrer: withoutParameters(document.referrer),
      transport_type: 'beacon'
    });
  };
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);
})();
