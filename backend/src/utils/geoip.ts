const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  IN: 'India',
  JP: 'Japan',
  AU: 'Australia',
  BR: 'Brazil',
  SG: 'Singapore',
  NL: 'Netherlands',
  ES: 'Spain',
};

export interface GeoLocationParsed {
  country: string;
  countryName: string;
  city: string;
}

export function parseGeoLocation(headers: Record<string, string | undefined>): GeoLocationParsed {
  const country = (headers['cloudfront-viewer-country'] || headers['CloudFront-Viewer-Country'] || 'US').toUpperCase();
  const city = headers['cloudfront-viewer-city'] || headers['CloudFront-Viewer-City'] || 'San Francisco';
  const countryName = COUNTRY_NAMES[country] || country;

  return { country, countryName, city };
}
