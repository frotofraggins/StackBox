// src/utils/aws-v3.ts
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

const region = process.env.AWS_REGION || 'us-west-2';
const credentials = fromNodeProviderChain();

export const ddbDoc = DynamoDBDocumentClient.from(new DynamoDBClient({ region, credentials }), {
  marshallOptions: { removeUndefinedValues: true }
});

export const s3 = new S3Client({ region, credentials });
export const ses = new SESClient({ region, credentials });
export const bedrock = new BedrockRuntimeClient({ region, credentials });

export async function s3SignedPutUrl(bucket: string, key: string, expiresSec = 900) {
  return getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: expiresSec });
}

export async function s3GetObjectBuffer(params: { Bucket: string; Key: string }) {
  const resp = await s3.send(new GetObjectCommand(params));
  const stream = resp.Body as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}

export function apigwMgmtClientFromUrl(endpoint: string) {
  return new ApiGatewayManagementApiClient({ region, endpoint });
}

export async function wsPostJson(client: ApiGatewayManagementApiClient, connectionId: string, payload: unknown) {
  await client.send(new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: Buffer.from(JSON.stringify(payload))
  }));
}
