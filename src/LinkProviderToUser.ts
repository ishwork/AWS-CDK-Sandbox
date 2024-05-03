import { CognitoIdentityServiceProvider } from 'aws-sdk';

type CognitoEvent = {
  triggerSource: string;
  userPoolId: string;
  request: {
    userAttributes: {
      email: string;
    };
  };
  userName: string;
}

const cognitoIdp = new CognitoIdentityServiceProvider()
const getUserByEmail = async (userPoolId: string, email: string) => {
 const params = {
   UserPoolId: userPoolId,
   Filter: `email = '${email}'`
 }
 return cognitoIdp.listUsers(params).promise();
}

const linkProviderToUser = async (username: string, userPoolId: string, providerName: string, providerUserId: string) => {
  try {
    const params = {
      DestinationUser: {
        ProviderAttributeValue: username,
        ProviderName: 'Cognito'
      },
      SourceUser: {
        ProviderAttributeName: 'Cognito_Subject',
        ProviderAttributeValue: providerUserId,
        ProviderName: providerName
      },
      UserPoolId: userPoolId
    };

    const response = await cognitoIdp.adminLinkProviderForUser(params).promise();
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const main = async (event: CognitoEvent) => {
  try {
    if (event.triggerSource === 'PreSignUp_ExternalProvider') {
      
      // Exclude Microsoft provider and emails with "aller.com" domain from linking
      if (event.userName.includes('Microsoft') || event.request.userAttributes.email.endsWith('@aller.com')) {
        return event;
      }
      // list users by email
      const usersWithEmail = await getUserByEmail(event.userPoolId, event.request.userAttributes.email);
      if (usersWithEmail?.Users && usersWithEmail.Users?.length > 0 && usersWithEmail.Users[0].Username) {
        const [providerName, providerUserId] = event.userName.split('_'); 
        await linkProviderToUser(usersWithEmail.Users[0].Username, event.userPoolId, providerName, providerUserId);
      } else {
        console.log('User not found, skip.');
      }
    }
    return event;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
