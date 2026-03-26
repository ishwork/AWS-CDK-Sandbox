import { Construct } from 'constructs';
import { SecretValue } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';

export interface PipelineProps {
  readonly githubAccount: string;
  readonly githubRepository: string;
  readonly githubAccessTokenSecret: string;
  readonly githubBranch?: string;
}

export class Pipeline extends Construct {
  public readonly codepipeline: CodePipeline;

  constructor(scope: Construct, id: string, props: PipelineProps) {
    super(scope, id);

    const githubBranch = props.githubBranch ?? 'master';

    this.codepipeline = new CodePipeline(this, 'CodePipeline', {
      pipelineName: 'InfraPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(
          `${props.githubAccount}/${props.githubRepository}`,
          githubBranch,
          {
            authentication: SecretValue.secretsManager(props.githubAccessTokenSecret),
          },
        ),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
        primaryOutputDirectory: 'cdk.out',
      }),
      selfMutation: true
    });
  }
}
