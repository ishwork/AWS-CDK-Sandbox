import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

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

    const userPool = new cognito.UserPool(this, 'seiska', {
      deletionProtection: true,
      userPoolName: 'seiska',
      customAttributes: {
        postal_code: new cognito.NumberAttribute({ mutable: true}),
        terms_accepted: new cognito.BooleanAttribute({ mutable: true }),
      }
    });

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
