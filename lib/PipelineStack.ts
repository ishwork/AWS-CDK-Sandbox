import { Stack, StackProps, Stage } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { InfraStack } from './InfraStack';
import { Pipeline } from './pipeline/Pipeline';

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, 'Pipeline', {
      githubAccount: process.env.GITHUB_ACCOUNT ?? 'ishwork',
      githubRepository: process.env.GITHUB_REPOSITORY ?? 'AWS-CDK-Sandbox',
      githubAccessTokenSecret: process.env.GITHUB_ACCESS_TOKEN_SECRET ?? 'github-access-token',
      githubBranch: process.env.GITHUB_BRANCH ?? 'master',
    });

    const deployStage = new Stage(this, 'Prod');

    new InfraStack(deployStage, 'Infrastructure');
    pipeline.codepipeline.addStage(deployStage);
  }
}
