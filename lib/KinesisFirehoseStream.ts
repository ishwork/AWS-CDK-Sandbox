import { Stack, StackProps, CfnResource } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as firehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Role, ServicePrincipal, Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export class KinesisFirehoseStream extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // const region = 'eu-west-1';

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

    // Create the Lambda function to process data for Firehose
    const lambdaFunction = new lambda.Function(this, 'FirehoseDataProcessor', {
      functionName: 'Test-FirehoseDataTransformationFunction',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          const output = event.records.map((record) => {
            const payload = Buffer.from(record.data, 'base64').toString('utf-8');
            let singleLineJson;
            try {
              const parsedData = JSON.parse(payload);
              singleLineJson = JSON.stringify(parsedData);
            } catch (error) {
              console.error('Error parsing JSON:', error);
              singleLineJson = JSON.stringify({ error: 'Invalid JSON format' });
            }
            const transformedData = Buffer.from(singleLineJson).toString('base64');
            return {
              recordId: record.recordId,
              result: 'Ok',
              data: transformedData,
            };
          });
          return { records: output };
        };
      `),
    });

    // Grant Firehose Role permission to invoke the Lambda function
    lambdaFunction.grantInvoke(firehoseRole);

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
        clusterJdbcurl: 'jdbc:redshift://fi-seiska-data-workgroup.124768067502.eu-west-1.redshift-serverless.amazonaws.com:5439/dev',
        copyCommand: {
          dataTableName: 'customers',
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
        processingConfiguration: {
        enabled: true,
        processors: [
          {
            type: 'Lambda',
            parameters: [
              {
                parameterName: 'LambdaArn',
                parameterValue: lambdaFunction.functionArn, 
              },
            ],
          },
        ],
      },
      },
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: dataStream.streamArn,
        roleArn: firehoseRole.roleArn,
      },
    });
    firehostDliverySteram.node.addDependency(firehosePolicy);
    firehostDliverySteram.node.addDependency(lambdaFunction);
  }
}
