import { Pinpoint, SecretsManager } from 'aws-sdk';

const pinpoint = new Pinpoint({ region: 'eu-west-1' });

type CognitoUserAttributes = {
  sub: string;
  email: string;
  [key: string]: string;
}

type CognitoEvent = {
  request: {
    userAttributes: CognitoUserAttributes;
    newDeviceUsed?: boolean;
    clientMetadata?: { [key: string]: string };
  };
  response: {};
}

// export const getPinpointAppId = async () => {
//   const secretManager = new SecretsManager({
//     region: 'eu-west-1',
//   });
//   const secret = await secretManager.getSecretValue({ SecretId: 'pinpointAppId' }).promise();
//   const pinpointAppId = secret.SecretString as string;
//   return pinpointAppId;
// };

export const main = async (event: CognitoEvent) => {

  if (!event || !event.request || !event.request.userAttributes) {
    console.error("Invalid event structure:", JSON.stringify(event));
    throw new Error("Invalid event structure");
  }

  const userId = event.request.userAttributes.sub;
  const userEmail = event.request.userAttributes.email;
  const pinpointAppId = process.env.PINPOINT_APP_ID as string;

  // Update the endpoint
  const updateEndpointParams = {
    ApplicationId: pinpointAppId,
    EndpointId: userId,
    EndpointRequest: {
      Address: userEmail,
      ChannelType: 'EMAIL',
      User: {
        UserId: userId,
        UserAttributes: {
          email: [userEmail],
        },
      },
    },
  };

  try {
    await pinpoint.updateEndpoint(updateEndpointParams).promise();
    console.log(`Endpoint updated for user: ${userId}`);
  } catch (error) {
    console.error(`Failed to update endpoint for user: ${userId}`, error);
  }

  // Record an event
  const putEventParams = {
    ApplicationId: pinpointAppId,
    EventsRequest: {
      BatchItem: {
        [userId]: {
          Endpoint: {},
          Events: {
            SignInEvent: {
              EventType: 'SignIn',
              Timestamp: new Date().toISOString(),
              Attributes: {
                SignInMethod: 'Cognito',
              },
            },
          },
        },
      },
    },
  };

  try {
    await pinpoint.putEvents(putEventParams).promise();
    console.log(`Event recorded for user: ${userId}`);
  } catch (error) {
    console.error(`Failed to record event for user: ${userId}`, error);
  }

  return event;
};
