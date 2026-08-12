export interface UserAgentParsed {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
}

export function parseUserAgent(uaString: string | undefined): UserAgentParsed {
  if (!uaString) {
    return { deviceType: 'unknown', browser: 'Unknown', os: 'Unknown' };
  }

  const ua = uaString.toLowerCase();
  
  // Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    deviceType = 'mobile';
  }

  // Browser
  let browser = 'Chrome';
  if (ua.includes('edg/')) {
    browser = 'Edge';
  } else if (ua.includes('chrome') && !ua.includes('chromium')) {
    browser = 'Chrome';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('opera') || ua.includes('opr/')) {
    browser = 'Opera';
  }

  // OS
  let os = 'Windows';
  if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  } else if (ua.includes('macintosh') || ua.includes('mac os x')) {
    os = 'macOS';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('windows')) {
    os = 'Windows';
  }

  return { deviceType, browser, os };
}

export function cleanReferer(refererHeader: string | undefined): string {
  if (!refererHeader) return 'Direct / None';
  try {
    const url = new URL(refererHeader);
    const host = url.hostname.toLowerCase();
    if (host.includes('google')) return 'Google Search';
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'Twitter / X';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('facebook')) return 'Facebook';
    if (host.includes('github')) return 'GitHub';
    if (host.includes('reddit')) return 'Reddit';
    if (host.includes('youtube')) return 'YouTube';
    return host;
  } catch {
    return 'Other';
  }
}
