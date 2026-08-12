import { APIGatewayProxyResult } from 'aws-lambda';

export const buildResponse = (
  statusCode: number,
  body: any,
  headers: Record<string, string> = {}
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
};

export const buildRedirect = (location: string): APIGatewayProxyResult => {
  return {
    statusCode: 301,
    headers: {
      Location: location,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
    body: '',
  };
};
