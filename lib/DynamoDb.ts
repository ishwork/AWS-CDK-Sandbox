import * as cdk from 'aws-cdk-lib';
import {
  CfnOutput,
  Stack,
  RemovalPolicy,
  aws_dynamodb as dynamodb,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

type DynamoDBTableProps = {
  exportPrefix?: string;
};

export class DynamoDB extends cdk.Stack {
  public readonly table: dynamodb.Table;
  constructor(scope: Construct, id: string, props: DynamoDBTableProps = {}, stackProps?: cdk.StackProps) {
    super(scope, id, stackProps);

    const { exportPrefix } = props;
    const { stackName } = Stack.of(this);
    const exportPrefixResolved = exportPrefix || stackName;


    const table = new dynamodb.Table(this, id, {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Add a Global Secondary Index (GSI) named 'countryIndex' to enable efficient queries by the 'country' attribute
    table.addGlobalSecondaryIndex({
      indexName: 'countryIndex',
      partitionKey: { name: 'country', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.table = table;

    // Output the DynamoDB table name after deployment
    // - Visible in the CloudFormation Outputs tab of the AWS Management Console
    // - Allows other stacks to import this value using the exportName
    // - Helps to share important resource information
    new CfnOutput(this, 'DynamoDBTable', {
      value: table.tableName,
      description: 'Table for storing customer data',
      exportName: `${exportPrefixResolved}-dynamoDBTable`,
    });
  }
}
