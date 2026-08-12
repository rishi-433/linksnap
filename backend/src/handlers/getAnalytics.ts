import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, URLS_TABLE, CLICKS_TABLE } from '../utils/dynamodb.js';
import { buildResponse } from '../utils/response.js';
import { UrlRecord, ClickRecord } from '../types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return buildResponse(200, {});
  }

  try {
    const shortCode = event.pathParameters?.shortCode;
    const timeframe = (event.queryStringParameters?.timeframe || '7d').toLowerCase();

    if (!shortCode) {
      return buildResponse(400, { error: 'Short code is required in path' });
    }

    // 1. Fetch URL metadata
    const urlResult = await docClient.send(
      new GetCommand({
        TableName: URLS_TABLE,
        Key: { url_id: shortCode },
      })
    );

    const urlRecord = urlResult.Item as UrlRecord | undefined;
    if (!urlRecord) {
      return buildResponse(404, { error: 'Shortened URL not found' });
    }

    // Calculate timestamp cutoff based on timeframe
    const now = new Date();
    let cutoff = new Date(0); // Epoch start for 'all'
    if (timeframe === '24h') {
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeframe === '7d') {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === '30d') {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const cutoffIso = cutoff.toISOString();

    // 2. Query LinkSnap_Clicks using GSI1
    const clicksResult = await docClient.send(
      new QueryCommand({
        TableName: CLICKS_TABLE,
        IndexName: 'GSI1_UrlClicks',
        KeyConditionExpression: 'url_id = :uid AND #ts >= :cutoff',
        ExpressionAttributeNames: { '#ts': 'timestamp' },
        ExpressionAttributeValues: {
          ':uid': shortCode,
          ':cutoff': cutoffIso,
        },
      })
    );

    const clickRecords = (clicksResult.Items || []) as ClickRecord[];

    // 3. Aggregate Time-Series Data
    const timeMap: Record<string, { label: string; clicks: number; ips: Set<string> }> = {};
    const is24h = timeframe === '24h';

    clickRecords.forEach((click) => {
      const clickDate = new Date(click.timestamp);
      let key = '';
      let label = '';

      if (is24h) {
        // Group by hour
        key = clickDate.toISOString().substring(0, 13) + ':00:00Z';
        label = clickDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        // Group by date
        key = clickDate.toISOString().substring(0, 10);
        label = clickDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }

      if (!timeMap[key]) {
        timeMap[key] = { label, clicks: 0, ips: new Set() };
      }
      timeMap[key].clicks += 1;
      timeMap[key].ips.add(click.ip_address);
    });

    const timeSeriesData = Object.entries(timeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timestamp, val]) => ({
        timestamp,
        label: val.label,
        clicks: val.clicks,
        uniqueVisitors: val.ips.size,
      }));

    // 4. Aggregate Geo Distribution
    const geoMap: Record<string, { countryName: string; clicks: number }> = {};
    clickRecords.forEach((click) => {
      const countryKey = click.country || 'US';
      const countryName = click.country_name || countryKey;
      if (!geoMap[countryKey]) {
        geoMap[countryKey] = { countryName, clicks: 0 };
      }
      geoMap[countryKey].clicks += 1;
    });

    const totalFilteredClicks = clickRecords.length || 1;

    const geoDistribution = Object.entries(geoMap)
      .map(([country, data]) => ({
        country,
        countryName: data.countryName,
        clicks: data.clicks,
        percentage: Math.round((data.clicks / totalFilteredClicks) * 100),
        latitude: 0,
        longitude: 0,
        cities: [],
      }))
      .sort((a, b) => b.clicks - a.clicks);

    // 5. Aggregate Devices
    const deviceMap: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
    clickRecords.forEach((click) => {
      const dev = click.device_type || 'desktop';
      deviceMap[dev] = (deviceMap[dev] || 0) + 1;
    });

    const deviceColors: Record<string, string> = {
      desktop: '#6366f1',
      mobile: '#22d3ee',
      tablet: '#a855f7',
      unknown: '#64748b',
    };

    const deviceBreakdown = Object.entries(deviceMap)
      .filter(([_, count]) => count > 0)
      .map(([device, count]) => ({
        device: device.charAt(0).toUpperCase() + device.slice(1),
        clicks: count,
        percentage: Math.round((count / totalFilteredClicks) * 100),
        color: deviceColors[device] || '#6366f1',
      }));

    // 6. Aggregate Referrers & Browsers
    const refMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};

    clickRecords.forEach((click) => {
      const ref = click.referer || 'Direct / None';
      refMap[ref] = (refMap[ref] || 0) + 1;

      const br = click.browser || 'Chrome';
      browserMap[br] = (browserMap[br] || 0) + 1;
    });

    const topReferrers = Object.entries(refMap)
      .map(([referer, clicks]) => ({
        referer,
        clicks,
        percentage: Math.round((clicks / totalFilteredClicks) * 100),
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    const browserBreakdown = Object.entries(browserMap)
      .map(([browser, clicks]) => ({
        browser,
        clicks,
        percentage: Math.round((clicks / totalFilteredClicks) * 100),
      }))
      .sort((a, b) => b.clicks - a.clicks);

    return buildResponse(200, {
      shortCode: urlRecord.url_id,
      originalUrl: urlRecord.original_url,
      totalClicks: urlRecord.total_clicks,
      timeframe,
      timeSeriesData,
      geoDistribution,
      deviceBreakdown,
      topReferrers,
      browserBreakdown,
    });
  } catch (error: any) {
    console.error('Error in getAnalytics handler:', error);
    return buildResponse(500, { error: 'Internal Server Error', message: error.message });
  }
};
