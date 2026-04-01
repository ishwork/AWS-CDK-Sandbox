import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export const main = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body ?? '{}');
    const registeredOn = new Date().toISOString();

    const item = {
      pk: `customer-${Date.now()}`,
      sk: `registered-${registeredOn}`,
      ...body,
      registeredOn,
    };

    await dynamo
      .put({
        TableName: process.env.TABLE_NAME as string,
        Item: item,
      })
      .promise();

    // console.log('Customer data saved:', item.pk);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Customer data submitted successfully',
        id: item.pk,
      }),
    };
  } catch (error) {
    console.error('Customer data error:', error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
