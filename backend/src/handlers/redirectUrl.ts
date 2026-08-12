import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, URLS_TABLE, CLICKS_TABLE } from '../utils/dynamodb.js';
import { buildRedirect, buildResponse } from '../utils/response.js';
import { parseUserAgent, cleanReferer } from '../utils/userAgent.js';
import { parseGeoLocation } from '../utils/geoip.js';
import { UrlRecord, ClickRecord } from '../types/index.js';
import { createHash, randomUUID } from 'crypto';

function hashIp(ip: string | undefined): string {
  if (!ip) return 'anon_00000000';
  return createHash('sha256').update(ip + 'SALT_KEY').digest('hex').substring(0, 16);
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const shortCode = event.pathParameters?.shortCode;
    if (!shortCode) {
      return buildResponse(400, { error: 'Short code is required in path.' });
    }

    // 1. Fetch URL item from DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: URLS_TABLE,
        Key: { url_id: shortCode },
      })
    );

    const urlRecord = result.Item as UrlRecord | undefined;

    if (!urlRecord || urlRecord.status !== 'active') {
      return buildResponse(404, { error: 'Link not found or link has been disabled.' });
    }

    // Check expiration
    if (urlRecord.expires_at) {
      const expires = new Date(urlRecord.expires_at).getTime();
      if (Date.now() > expires) {
        return buildResponse(410, { error: 'Link has expired.' });
      }
    }

    // 2. Increment total_clicks atomically in DynamoDB
    const nowIso = new Date().toISOString();
    
    // Async update & click telemetry recording
    const updatePromise = docClient.send(
      new UpdateCommand({
        TableName: URLS_TABLE,
        Key: { url_id: shortCode },
        UpdateExpression: 'ADD total_clicks :inc',
        ExpressionAttributeValues: { ':inc': 1 },
      })
    );

    // 3. Extract request telemetry metadata
    const headers = event.headers || {};
    const ipRaw = event.requestContext?.identity?.sourceIp || headers['x-forwarded-for'];
    const ipHashed = hashIp(ipRaw);
    const geo = parseGeoLocation(headers);
    const ua = parseUserAgent(headers['user-agent'] || headers['User-Agent']);
    const referer = cleanReferer(headers['referer'] || headers['Referer']);

    const clickRecord: ClickRecord = {
      click_id: randomUUID(),
      timestamp: nowIso,
      url_id: shortCode,
      ip_address: ipHashed,
      country: geo.country,
      country_name: geo.countryName,
      city: geo.city,
      user_agent: headers['user-agent'] || 'Unknown',
      device_type: ua.deviceType,
      browser: ua.browser,
      os: ua.os,
      referer: referer,
    };

    const clickPromise = docClient.send(
      new PutCommand({
        TableName: CLICKS_TABLE,
        Item: clickRecord,
      })
    );

    // Wait for click log & metric update
    await Promise.all([updatePromise, clickPromise]);

    // 4. Return HTTP 301 Redirect
    return buildRedirect(urlRecord.original_url);
  } catch (error: any) {
    console.error('Error in redirectUrl handler:', error);
    return buildResponse(500, { error: 'Internal Server Error', message: error.message });
  }
};
