import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CfnServiceLinkedRole, Role, ServicePrincipal, Policy, PolicyStatement, Effect, PolicyDocument, CfnPolicy, ManagedPolicy  } from 'aws-cdk-lib/aws-iam';
import { aws_pinpoint as pinpoint } from 'aws-cdk-lib';
import { join } from 'path';

export interface CognitoProps {
  /**
   * Export naming prefix (defaults to stack name)
   *
   * Used to avoid export name collisions
   */
  exportPrefix?: string;
}

export class UserPool extends cdk.Stack {
  public readonly userPool: cognito.UserPool;

  constructor(scope: Construct, id: string, { exportPrefix }: CognitoProps) {
    super(scope, id);

     const { stackName } = cdk.Stack.of(this);
    const exportPrefixResolved = exportPrefix || stackName;

    const lambdaFunction = new NodejsFunction(this, 'PreSignUpLambda', {
      runtime: Runtime.NODEJS_16_X,
      handler: 'main',
      entry: join(__dirname, `../src/LinkProviderToUser.ts`),
    });

    // create a lambda function to be used as a post-authentication trigger
    const cognitoPostAuthPinpointAnalyticsLambda = new NodejsFunction(this, 'CognitoPostAuthPinpointAnalytics', {
      functionName: 'Test-CognitoPostAuthPinpointAnalyticsLambda',
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      runtime: Runtime.NODEJS_18_X,
      handler: 'main',
      entry: join(__dirname, `../src/CognitoPostAuthPinpointAnalytics.ts`),
      environment: {
        PINPOINT_APP_ID: cdk.SecretValue.secretsManager('Seiska-Userpool-PinpointProjectAppId').unsafeUnwrap(),
      },
    });


    const userPool = new cognito.UserPool(this, 'seiska', {
      deletionProtection: true,
      userPoolName: 'seiska',
      customAttributes: {
        postal_code: new cognito.NumberAttribute({ mutable: true}),
        terms_accepted: new cognito.BooleanAttribute({ mutable: true }),
      },
      lambdaTriggers: {
        preSignUp: lambdaFunction,
      },
    });

    // Create a Pinpoint project
    const pinpointProject = new pinpoint.CfnApp(this, 'MyCfnApp', {
    name: 'TestProject1',
    });

    // Attach inline policy to the lambda function
    lambdaFunction.role!.attachInlinePolicy(new Policy(this, 'LambdaPolicy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['cognito-idp:adminLinkProviderForUser', 'cognito-idp:ListUsers'],
          resources: [userPool.userPoolArn],
        }),
      ],
    }));

    cognitoPostAuthPinpointAnalyticsLambda.role!.attachInlinePolicy(new Policy (this, 'pinpoint-policy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['mobiletargeting:UpdateEndpoint', 'mobiletargeting:PutEvents'],
          resources: [`${pinpointProject.attrArn}/*`],
        }),
      ],
    }));

    // userPool.addTrigger(cognito.UserPoolOperation.PRE_SIGN_UP, lambdaFunction);

    // Define the IAM role for the Lambda function
    // const lambdaRole = new Role(this, 'MyLambdaFunctionRole', {
    //   assumedBy: new ServicePrincipal('lambda.amazonaws.com'), // Lambda service principal
    // });

    // Provide permissions to the role to link the provider to the user pool
    // lambdaRole.addToPolicy(new PolicyStatement({
    //   effect: Effect.ALLOW,
    //   actions: ['cognito-idp:adminLinkProviderForUser'],
    //   resources: [userPool.userPoolArn],
    //   principals: [new AnyPrincipal()], // Allow access to all authenticated users
    // }));

    const { userPoolId } = userPool;
    const standardCognitoWriteAttributes = [
      'address',
      'birthdate',
      'email',
      'family_name',
      'gender',
      'given_name',
      'locale',
      'middle_name',
      'name',
      'nickname',
      'phone_number',
      'picture',
      'preferred_username',
      'profile',
      'updated_at',
      'website',
      'zoneinfo',
      'custom:postal_code',
      'custom:terms_accepted'
    ];

    const standardCognitoReadAttributes = [
      ...standardCognitoWriteAttributes,
      'email_verified',
      'phone_number_verified',
    ];

    // Retrieve externlaId secret from Secrets Manager
    const externalIdSecret = Secret.fromSecretNameV2(this, 'ExternalId', 'external-Id');

    // UUID for the external ID
    const externalId = externalIdSecret.secretValue.unsafeUnwrap();

    // Step 1: Create the service-linked role AWSServiceRoleForAmazonCognitoIdp
    // const cognitoServiceRole = new CfnServiceLinkedRole(this, 'AWSServiceRoleForAmazonCognitoIdp', {
    //   awsServiceName: 'cognito-idp.amazonaws.com',
    //   description: 'Service-linked role for Amazon Cognito to interact with Amazon Pinpoint',
    //   customSuffix: 'CognitoServiceLinkedRole',
    // });

    // Define a custom IAM role for Amazon Pinpoint
    // const pinpointRole = new Role(this, 'PinpointRole', {
    //   assumedBy: new ServicePrincipal('pinpoint.amazonaws.com'),
    //   externalIds: [externalId],
    // });

    // Create an IAM role for Cognito to interact with Pinpoint
    const cognitoPinpointRole = new Role(this, 'CognitoPinpointIntegrationRole', {
      assumedBy: new ServicePrincipal('cognito-idp.amazonaws.com'),
      description: 'Custom role for Amazon Cognito to interact with Amazon Pinpoint',
      externalIds: [externalId],
      inlinePolicies: {
        'Policy': new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['mobiletargeting:UpdateEndpoint', 'mobiletargeting:PutEvents'],
              resources: [pinpointProject.attrArn],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['cognito-idp:Describe*'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const analyticsConfigurationProperty: cognito.CfnUserPoolClient.AnalyticsConfigurationProperty = {
      // applicationArn: pinpointProject.attrArn,
      applicationId: pinpointProject.ref,
      externalId: externalId,
      roleArn: cognitoPinpointRole.roleArn,
      userDataShared: true,
    }; 

    new cognito.CfnUserPoolClient(this, 'app-client', {
      userPoolId,
      clientName: 'Seiska.fi',
      allowedOAuthFlowsUserPoolClient: true,
      allowedOAuthFlows: ['code'],
      allowedOAuthScopes: ['email', 'openid', 'profile', 'aws.cognito.signin.user.admin'],
      generateSecret: true,
      callbackUrLs: [
        'http://localhost:9010/api/auth/callback/cognito',
        'http://localhost:8080/api/auth/callback/cognito',
      ],
      logoutUrLs: [
        'http://localhost:9010',
        'http://localhost:8080',
      ],
      readAttributes: standardCognitoReadAttributes,
      writeAttributes: standardCognitoWriteAttributes,
      analyticsConfiguration: analyticsConfigurationProperty,
    });

    new CfnOutput(this, 'seiska-test-userpool', {
      value: userPoolId,
      description: 'Userpool for Seiska users',
      exportName: `${exportPrefixResolved}-seiska-test-userpool`,
    });
  }
}
