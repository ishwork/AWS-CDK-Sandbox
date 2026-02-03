import { Construct } from 'constructs';
import { SecretValue } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';

export type PipelineProps = {
  /**
   * Github repository name (required)
   */
  githubRepository: string;

  /**
   * Github account. Defaults to 'ishwork'
   */
  githubAccount?: string;

  /**
   * Github branch name. Defaults to 'master'
   */
  githubBranch?: string;

  /**
   * Github repository access token name in Secrets Manager
   */
  oauthTokenSecret?: string;

  /**
   * Path to CDK application. Defaults to current directory
   */
  cdkAppPath?: string;
};

export class Pipeline extends Construct {
  public readonly codepipeline: CodePipeline;

  constructor(
    scope: Construct,
    id: string,
    {
      githubRepository,
      githubAccount = 'ishwork',
      githubBranch = 'master',
      oauthTokenSecret = 'github-access-token',
      cdkAppPath = '.',
    }: PipelineProps
  ) {
    super(scope, id);

    this.codepipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: `${githubRepository}-pipeline`,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(`${githubAccount}/${githubRepository}`, githubBranch, {
          authentication: SecretValue.secretsManager(oauthTokenSecret),
        }),
        commands: [
          cdkAppPath !== '.' ? `cd ${cdkAppPath}` : '',
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ].filter(cmd => cmd !== ''),
        primaryOutputDirectory: cdkAppPath !== '.' ? `${cdkAppPath}/cdk.out` : 'cdk.out',
      }),
      selfMutation: true,
    });
  }
}
