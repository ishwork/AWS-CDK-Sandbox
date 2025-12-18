#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { DataCollectionApi } from '../lib/DataCollectionApi';
import { DynamoDB } from '../lib/DynamoDb';
import { KinesisFirehoseStream } from '../lib/KinesisFirehoseStream';
import { SagemakerStudio } from '../lib/SageMaker';
import { SimpleEmailService } from '../lib/SES';
import { UserPool } from '../lib/Cognito';
import { VPC } from '../lib/VPC';

const app = new cdk.App();
new DynamoDB(app, 'TestDynamoDB', { exportPrefix: 'CustomerData' }, {
    env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION }
});
// new VPC(app, 'VPC', { exportPrefix: 'VpcTest' }, {
// /* Uncomment the next line if you know exactly what Account and Region you want to deploy the stack to. */
// /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
//     env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION }
// });
// new UserPool(app, 'UserPool', {});
// new KinesisFirehoseStream(app, 'Test-KinesisFirehoseStream', {});
// new DataCollectionApi(app, 'DataCollectionApi', {});
// new SimpleEmailService(app, 'TestSimpleEmailService', {});
// new SagemakerStudio(app, 'SagemakerStudio', {
//     env: { account: process.env.AWS_ACCOUNT_ID, region: process.env.AWS_REGION }
// });