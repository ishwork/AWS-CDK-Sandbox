import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import {
  Vpc as CdkVpc,
  IpAddresses,
} from "aws-cdk-lib/aws-ec2";

export interface VpcProps {
  /**
   * The CIDR range to use for the VPC, e.g. '10.150.0.0/23'.
   *
   * Should be a minimum of /28 and maximum size of /16. The range will be split across all
   * subnets per Availability Zone.
   */
  vpcCidr?: string;

  /**
   * Export naming prefix (defaults to stack name)
   *
   * Used to avoid export name collisions
   */
  exportPrefix?: string;

  /**
   * Deployment revision (default: 1)
   *
   * Used to separate named resources, exports etc. between multiple deployments
   */
  revision?: number;
}

export class VpcTestStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcProps = {}, stackProps?: cdk.StackProps) {
    super(scope, id, stackProps);
    const { exportPrefix } = props;
    const { stackName } = cdk.Stack.of(this);
    const exportPrefixResolved = exportPrefix || stackName;

    // Specify VPC CIDR block
    const vpcCidr = '10.0.0.0/16';

    /**
     * VPC
     */
    const vpc = new CdkVpc(this, "Vpc", {
      ipAddresses: IpAddresses.cidr(vpcCidr),
      availabilityZones: ["eu-west-1a", "eu-west-1b", "eu-west-1c"],
      subnetConfiguration: [
        {
          cidrMask: 26,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 26,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsSupport: true,
    });

    //Outputs
    new cdk.CfnOutput(this, 'VPCID', {
      value: vpc.vpcId,
      exportName: `${exportPrefixResolved}-VPCID`,
    });
    new cdk.CfnOutput(this, 'VPCCIDR', {
      value: vpc.vpcCidrBlock,
      exportName: `${exportPrefixResolved}-VPCCIDR`,
    });

    new cdk.CfnOutput(this, vpc.publicSubnets[0].node.id, { 
      value: vpc.publicSubnets[0].subnetId,
      exportName: `${exportPrefixResolved}-Subnet1`
    });
    new cdk.CfnOutput(this, vpc.publicSubnets[1].node.id, { 
      value: vpc.publicSubnets[1].subnetId,
      exportName: `${exportPrefixResolved}-Subnet2`
     });
    new cdk.CfnOutput(this, vpc.publicSubnets[2].node.id, { 
      value: vpc.publicSubnets[2].subnetId,
      exportName: `${exportPrefixResolved}-Subnet3`
    });
  }
}
