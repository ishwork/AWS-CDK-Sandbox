import { CfnOutput, Duration, aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import {
  AuthorizationType,
  Cors,
  EndpointType,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

type CustomerDataApiProps = {
  table: dynamodb.Table;
};

export class CustomerDataApi extends Construct {
  public readonly api: RestApi;

  constructor(scope: Construct, id: string, props: CustomerDataApiProps) {
    super(scope, id);

    const { table } = props;

    const customerDataLambda = new NodejsFunction(this, 'CustomerDataLambda', {
      functionName: 'CustomerDataHandler',
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../src/Lambda/CustomerData.ts'),
      handler: 'main',
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantWriteData(customerDataLambda);

    const api = new RestApi(this, 'CustomerDataApi', {
      restApiName: 'CustomerDataApi',
      description: 'API Gateway for customer data submissions',
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: 'prod',
      },
      defaultMethodOptions: {
        authorizationType: AuthorizationType.NONE,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['POST', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
      },
    });

    const formResource = api.root.addResource('form');
    formResource.addMethod('POST', new LambdaIntegration(customerDataLambda));

    new CfnOutput(this, 'CustomerDataApiUrl', {
      value: `${api.url}form`,
      description: 'Endpoint for submitting customer data',
      exportName: 'CustomerDataApiUrl',
    });

    this.api = api;
  }
}
