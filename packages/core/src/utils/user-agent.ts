/**
 * Device type enum
 */
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

/**
 * Parsed user agent information
 */
export type ParsedUserAgent = {
  browser: string;
  os: string;
  deviceType: DeviceType;
};

/**
 * Parse user agent string to extract browser, OS, and device type
 */
export function parseUserAgent(userAgent?: string): ParsedUserAgent {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      deviceType: 'unknown'
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('edg/')) {
    browser = 'Edge';
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox';
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Safari';
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera';
  }

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }

  // Detect device type
  let deviceType: DeviceType = 'desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  }

  return {
    browser,
    os,
    deviceType
  };
}
