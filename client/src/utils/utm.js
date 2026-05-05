export function captureUTMs() {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');

  if (utmSource || utmMedium || utmCampaign) {
    const utms = {
      utm_source: utmSource || '',
      utm_medium: utmMedium || '',
      utm_campaign: utmCampaign || '',
      captured_at: new Date().toISOString(),
    };
    sessionStorage.setItem('cardfinder_utms', JSON.stringify(utms));
  }
}

export function getUTMs() {
  try {
    const stored = sessionStorage.getItem('cardfinder_utms');
    if (!stored) return { utm_source: null, utm_medium: null, utm_campaign: null };
    const utms = JSON.parse(stored);
    return {
      utm_source: utms.utm_source || null,
      utm_medium: utms.utm_medium || null,
      utm_campaign: utms.utm_campaign || null,
    };
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }
}

export function clearUTMs() {
  sessionStorage.removeItem('cardfinder_utms');
}
