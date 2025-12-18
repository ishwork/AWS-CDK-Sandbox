import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { VPC } from '../lib/VPC';

describe('VPC Construct', () => {
	test('creates a VPC with the specified CIDR and exportPrefix', () => {
		const app = new cdk.App();
		const stack = new cdk.Stack(app, 'TestStack');
		new VPC(stack, 'TestVPC', {
			vpcCidr: '10.1.0.0/16',
			exportPrefix: 'UnitTestVpc',
		});
		const template = Template.fromStack(stack);
		template.resourceCountIs('AWS::EC2::VPC', 1);
		template.hasResourceProperties('AWS::EC2::VPC', {
			CidrBlock: '10.1.0.0/16',
		});
	});
});
