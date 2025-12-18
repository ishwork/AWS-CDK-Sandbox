# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## Setting up AWS Credentials using AWS CLI

To provide AWS credentials for your CDK app or SDK usage, follow these steps:

1. Install the AWS CLI if you haven't already: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
2. Run the following command in your terminal: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html

	```sh
	aws configure
	```

3. Enter your AWS Access Key ID, Secret Access Key, default region (e.g., eu-west-1), and output format (e.g., json) when prompted.

This will save credentials in `~/.aws/credentials` and configuration in `~/.aws/config`, which are automatically used by the AWS SDK and CDK CLI.