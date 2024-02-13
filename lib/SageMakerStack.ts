import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';

export class SagemakerStudioStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const region = props?.env?.region || 'eu-west-1';

    // create a SageMakerExecutionRole-${region}-cdk for the SageMaker Studio
    let sagemakerExecutionRole = new Role(this, 'SageMakerExecutionRole', {
      assumedBy: new ServicePrincipal('sagemaker.amazonaws.com'),
      roleName: `SageMakerExecutionRole-${region}`,
      description: 'SageMaker execution role',
    });

    // add AmazonSageMakerFullAccess and AmazonS3FullAccess to the role
    sagemakerExecutionRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess')
    );

    sagemakerExecutionRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
    );

    // create a SageMakerUserSettings for the SageMaker Studio
    const userSettings = {
      executionRole: sagemakerExecutionRole.roleArn,
    };

    // set a default VPC for the SageMaker Studio
    const defaultVpc = ec2.Vpc.fromLookup(this, 'my-test-vpc', {
      vpcId: 'vpc-0cbb5e96ad5191c17',
      isDefault: false,
    });

    const vpcSubnets = defaultVpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    });

    // create a SageMakerDomain for the SageMaker Studio
    const domain = new sagemaker.CfnDomain(this, 'Test-Domain', {
      authMode: 'IAM',
      domainName: 'fi-seiska-data-domain',
      defaultUserSettings: userSettings,
      subnetIds: vpcSubnets.subnetIds,
      vpcId: defaultVpc.vpcId,
    });

    // create a SageMakerUserProfile for the SageMaker Studio
    const profile = { team: 'seiska', name: 'data-analytics' };

    new sagemaker.CfnUserProfile(this, 'SageMakerUserProfile', {
      domainId: domain.attrDomainId,
      userProfileName: `${profile.team}-${profile.name}`,
      userSettings: userSettings,
    });
  }
}
