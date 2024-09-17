import { Stack, StackProps, CfnResource } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as firehose from 'aws-cdk-lib/aws-kinesisfirehose';
import { Role, ServicePrincipal, Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export class KinesisFirehoseStream extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const region = props?.env?.region || 'eu-west-1';

    const bucketArn = 'arn:aws:s3:::ishwor-test-datasource';

    // Get a reference to the existing bucket using its ARN
    const bucket = s3.Bucket.fromBucketArn(this, 'ishwor-test-datasource', bucketArn);

    // Create the IAM role for Firehose
    const firehoseRole = new Role(this, 'FirehoseStreamRole', {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com'),
    });

    // Grant permission to read and write to bucket
    bucket.grantReadWrite(firehoseRole);
    
    // Create the Kinesis Data Stream
    const dataStream = new kinesis.Stream(this, 'Test-Kinesis-data-stream', {
      streamName: 'Test-Kinesis-data-stream',
      encryption: kinesis.StreamEncryption.MANAGED,
      shardCount: 1,
    });

    // Create the IAM policy for Firehose
    const firehosePolicy = new Policy(this, 'FirehosePolicy', {
      roles: [firehoseRole],
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [dataStream.streamArn],
          actions: ['kinesis:DescribeStream', 'kinesis:GetShardIterator', 'kinesis:GetRecords'],
        }),
      ],
    });

    dataStream.grantRead(firehoseRole);
    dataStream.grant(firehoseRole, 'kinesis:DescribeStream');

    // Create the Kinesis Data Firehose delivery stream
    const firehostDliverySteram = new firehose.CfnDeliveryStream(this, 'FirehoseDeliveryStream', {
      deliveryStreamName: 'Test-Firehose-delivery-stream',
      deliveryStreamType: "KinesisStreamAsSource",
      // extendedS3DestinationConfiguration: {
      //   bucketArn: bucket.bucketArn,
      //   roleArn: firehoseRole.roleArn,
      //   prefix: 'raw/',
      //   // bufferingHints: {
      //   //   intervalInSeconds: 60,
      //   //   sizeInMBs: 128,
      //   // },
      //   // compressionFormat: 'GZIP',
      //   errorOutputPrefix: 'error/',
      // },
      redshiftDestinationConfiguration: {
        roleArn: firehoseRole.roleArn,
        clusterJdbcurl: 'jdbc:redshift://test-redshift-workgroup.124768067502.eu-west-1.redshift-serverless.amazonaws.com:5432/dev',
        copyCommand: {
          dataTableName: 'test',
        },
        username: 'admin',
        password: 'Ishworkhadka123',
        s3Configuration: {
          bucketArn: bucket.bucketArn,
          roleArn: firehoseRole.roleArn,
          prefix: 'raw-data/',
        // bufferingHints: {
        //   intervalInSeconds: 60,
        //   sizeInMBs: 128,
        // },
        // compressionFormat: 'GZIP',
        // errorOutputPrefix: 'error/',
        },
      },
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: dataStream.streamArn,
        roleArn: firehoseRole.roleArn,
      },
    });
    firehostDliverySteram.node.addDependency(firehosePolicy);
  }
}
