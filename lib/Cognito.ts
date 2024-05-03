import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Role, ServicePrincipal, Policy, PolicyStatement, Effect, AnyPrincipal } from 'aws-cdk-lib/aws-iam';
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
    // userPool.addTrigger(cognito.UserPoolOperation.PRE_SIGN_UP, lambdaFunction);

    // // Define the IAM role for Cognito
    // const cognitoRole = new Role(this, 'CognitoRole', {
    //   assumedBy: new ServicePrincipal('cognito-idp.amazonaws.com'),
    // });

    // // provide permissions to the role to link the provider to the user pool 
    // cognitoRole.attachInlinePolicy( new Policy(this, 'CognitoPolicy', {
    //   statements: [
    //     new PolicyStatement({
    //       effect: Effect.ALLOW,
    //       actions: ['cognito-idp:adminLinkProviderForUser'],
    //       resources: [userPool.userPoolArn],
    //       principals: [new AnyPrincipal()], // allow access to all authenticated users
    //     }),
    //   ],
    // }));

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

    // Create a Lambda function
    // const myLambdaFunction = new NodejsFunction(this, 'MyLambdaFunction', {
    //   runtime: Runtime.NODEJS_18_X,
    //   handler: 'main',
    //   entry: join(__dirname, `/../src/lambda.ts`),
    //   // code: lambda.Code.fromAsset('lambda'), // Assuming your Lambda code is in a directory named 'lambda'
    //   role: lambdaRole, // Pass the role to the Lambda function
    // });

    // Add Lambda function as a trigger to the Cognito User Pool
    // userPool.addTrigger(cognito.UserPoolOperation.PRE_SIGN_UP, myLambdaFunction);

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
    });

    new CfnOutput(this, 'seiska-test-userpool', {
      value: userPoolId,
      description: 'Userpool for Seiska users',
      exportName: `${exportPrefixResolved}-seiska-test-userpool`,
    });
  }
}
