import { Stack, StackProps, Stage } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { InfraStack } from './InfraStack';
import { Pipeline } from './Pipeline';

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, 'Pipeline', {
      githubRepository: 'AWS-CDK-Sandbox',
    });

    const deployStage = new Stage(this, 'Prod');
    new InfraStack(deployStage, 'Infrastructure');
    pipeline.codepipeline.addStage(deployStage);
  }
}
