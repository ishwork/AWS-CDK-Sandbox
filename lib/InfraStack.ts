import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';

import { DataCollectionApi } from '@/lib/DataCollectionApi';
import { DynamoDB } from '@/lib/DynamoDb';
import { KinesisFirehoseStream } from '@/lib/KinesisFirehoseStream';
import { SagemakerStudio } from '@/lib/SageMaker';
import { SimpleEmailService } from '@/lib/SES';
import { UserPool } from '@/lib/Cognito';
import { VPC } from '@/lib/VPC';

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Define VPC
    new VPC(this, 'VPC', {
        exportPrefix: 'TestVpc',
        vpcCidr: '10.0.0.0/16', // Specify VPC CIDR block
        revision: 1,
    });
    // Define DynamoDB
    new DynamoDB(this, 'DynamoDB', {
        exportPrefix: 'CustomerData',
    });

    // Define Cognito User Pool
    // new UserPool(this, 'Cognito', {
    //     exportPrefix: 'TestCognito',
    // });

    // Define Data Collection API
    // new DataCollectionApi(this, 'DataCollectionApi');

    // Define Kinesis Firehose Stream
    // new KinesisFirehoseStream(this, 'KinesisFirehoseStream');

    // Define Simple Email Service
    // new SimpleEmailService(this, 'SimpleEmailService');

    // Define SageMaker Studio
    // new SagemakerStudio(this, 'SagemakerStudio');
  }
}