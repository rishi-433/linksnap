import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, URLS_TABLE } from '../utils/dynamodb.js';
import { buildResponse } from '../utils/response.js';
import { ShortenPayload, UrlRecord } from '../types/index.js';

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'https://lsnap.link';

function generateShortCode(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return buildResponse(200, {});
  }

  try {
    if (!event.body) {
      return buildResponse(400, { error: 'Request body is required' });
    }

    const payload: ShortenPayload = JSON.parse(event.body);

    if (!payload.originalUrl || !isValidUrl(payload.originalUrl)) {
      return buildResponse(400, { error: 'Invalid URL. Must be a valid HTTP/HTTPS web address.' });
    }

    let shortCode = payload.customSlug ? payload.customSlug.trim() : '';

    if (shortCode) {
      // Validate custom slug
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(shortCode)) {
        return buildResponse(400, {
          error: 'Custom slug must be 3-30 characters long and contain only letters, numbers, hyphens, and underscores.',
        });
      }

      // Check if custom slug is available
      const existing = await docClient.send(
        new GetCommand({
          TableName: URLS_TABLE,
          Key: { url_id: shortCode },
        })
      );

      if (existing.Item) {
        return buildResponse(409, { error: 'Custom slug is already taken. Please choose another one.' });
      }
    } else {
      // Generate unique short code
      let attempts = 0;
      let unique = false;
      while (!unique && attempts < 5) {
        shortCode = generateShortCode(6);
        const check = await docClient.send(
          new GetCommand({
            TableName: URLS_TABLE,
            Key: { url_id: shortCode },
          })
        );
        if (!check.Item) {
          unique = true;
        }
        attempts++;
      }
    }

    const now = new Date().toISOString();
    const urlRecord: UrlRecord = {
      url_id: shortCode,
      original_url: payload.originalUrl,
      user_id: event.requestContext?.authorizer?.claims?.sub || 'anonymous_user',
      created_at: now,
      expires_at: payload.expiresAt || null,
      total_clicks: 0,
      custom_slug: payload.customSlug || null,
      title: payload.title || payload.originalUrl,
      status: 'active',
    };

    await docClient.send(
      new PutCommand({
        TableName: URLS_TABLE,
        Item: urlRecord,
      })
    );

    return buildResponse(201, {
      shortCode: urlRecord.url_id,
      shortUrl: `${BASE_DOMAIN}/${urlRecord.url_id}`,
      originalUrl: urlRecord.original_url,
      createdAt: urlRecord.created_at,
      expiresAt: urlRecord.expires_at,
      totalClicks: 0,
    });
  } catch (error: any) {
    console.error('Error in shortenUrl handler:', error);
    return buildResponse(500, { error: 'Internal Server Error', message: error.message });
  }
};
