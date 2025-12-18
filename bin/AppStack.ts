#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { InfraStack } from '@/lib/InfraStack';

const app = new cdk.App();
new InfraStack(app, 'InfraStack', {
    /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
    env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION }
});