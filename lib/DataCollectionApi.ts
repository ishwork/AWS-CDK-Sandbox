import { Stack, StackProps, CfnResource } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import { Role, ServicePrincipal, Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { AuthorizationType,
  AwsIntegration,
  Cors,
  EndpointType,
  JsonSchemaType,
  Model,
  PassthroughBehavior,
  RequestValidator,
  RestApi, } from 'aws-cdk-lib/aws-apigateway';

export class DataCollectionApi extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const region = props?.env?.region || 'eu-west-1';

    const streamArn = 'arn:aws:kinesis:eu-west-1:124768067502:stream/Ishwor-test-data-stream';

    // Define IAM role for API Gateway
    const dataCollectionApiRole = new Role(this, 'ApiGatewayRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      roleName: 'DataCollectionApiGatewayRole', 
      description: 'Role for API Gateway to access other AWS services',
    });

    // Define the IAM policy for the API Gateway
    const dataCollectionApiPolicy = new Policy(this, 'DataCollectionApiPolicy', {
      policyName: 'DataCollectionApiPolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['kinesis:PutRecords'],
          resources: [streamArn],
        }),
      ],
    });

    dataCollectionApiRole.attachInlinePolicy(dataCollectionApiPolicy);

    // Get the Kinesis Data Stream by ARN
    const stream = kinesis.Stream.fromStreamArn(this, 'DataStream', streamArn);

    stream.grantWrite(dataCollectionApiRole);

    // Define the API Gateway
    const dataCoolectionApi = new RestApi(this, 'DataCollectionApi', {
      restApiName: 'DataCollectionApi',
      description: 'API Gateway for data collection',
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: 'test',
      },
      defaultMethodOptions: {
        authorizationType: AuthorizationType.NONE,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
      },
    });

    // Define the API Gateway resource
    const dataCollectionResource = dataCoolectionApi.root.addResource('data-collection');

        // Request validator and models
    const collectionRequestValidator = new RequestValidator(this, 'CollectionRequestValidator', {
      restApi: dataCoolectionApi,
      validateRequestBody: true,
    });

    // Define data collection request model
    const collectionRequestModel = new Model(this, 'CollectionRequestModel', {
      modelName: 'CollectionRequestModel',
      description: 'Model for data collection request',
      restApi: dataCoolectionApi,
      contentType: 'application/json',
      schema: {
        type: JsonSchemaType.ARRAY,
        items: {
          type: JsonSchemaType.OBJECT,
          properties: {
            category: { type: JsonSchemaType.STRING },
            timestamp: { type: JsonSchemaType.STRING },
          },
          required: ['category', 'timestamp'],
        },
      },
    });

    //apiGateWay kinesis integration
    const apiGatewayKinesisIntegration = new AwsIntegration({
      service: 'kinesis',
      action: 'PutRecords',
      options: {
        credentialsRole: dataCollectionApiRole,
        // do not pass request parameters through to the backend service
        passthroughBehavior: PassthroughBehavior.NEVER,
        // content type of JSON payload
        requestParameters: {
          'integration.request.header.Content-Type': "'x-amz-json-1.1'",
        },
        requestTemplates: {
          'application/json': `{
            "StreamName": "Ishwor-test-data-stream",
            "Records": [
              #foreach($elem in $input.path('$'))
              {
                "Data": "$util.base64Encode($elem.category + ',' + $elem.timestamp)",
                "PartitionKey": "$elem.category"
              }#if($foreach.hasNext),#end
              #end
            ]
          }`,
        },        
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': JSON.stringify({
                message: 'Data sent to Kinesis stream successfully',
              }),
            },
            // responseParameters: {
            //   'method.response.header.Access-Control-Allow-Origin': "'*'",
            // },
          },
        ],
      },
    });


    // Define the API Gateway method
    dataCollectionResource.addMethod('POST', apiGatewayKinesisIntegration, {
      requestValidator: collectionRequestValidator,
      requestModels: {
        'application/json': collectionRequestModel,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': collectionRequestModel,
          },
        },
      ],
    });
  }
}

