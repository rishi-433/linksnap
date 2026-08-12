import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

export const URLS_TABLE = process.env.URLS_TABLE_NAME || 'LinkSnap_URLs';
export const CLICKS_TABLE = process.env.CLICKS_TABLE_NAME || 'LinkSnap_Clicks';
