This project uses AWS CDK with TypeScript to define, manage, and deploy core AWS infrastructure resources. It includes an `InfraStack` for provisioning AWS services and a `PipelineStack` that automates deployments via AWS CodePipeline, enabling a fully self-mutating CI/CD pipeline triggered from GitHub.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template

## Setting up AWS Credentials using AWS CLI

To provide AWS credentials for your CDK app or SDK usage, follow these steps:

1. Install the AWS CLI if you haven't already: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
2. Run the following command in your terminal: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html

   ```sh
   aws configure
   ```

3. Enter your AWS Access Key ID, Secret Access Key, default region (e.g., eu-west-1), and output format (e.g., json) when prompted.

This will save credentials in `~/.aws/credentials` and configuration in `~/.aws/config`, which are automatically used by the AWS SDK and CDK CLI.

## About InfraStack

- Centralizes and manages core AWS infrastructure resources for this project using AWS CDK.
- Provisions foundational services such as VPC, Cognito, DynamoDB, Kinesis Firehose, SageMaker, SES, and other shared components.
- Promotes a modular and maintainable infrastructure codebase.
- Streamlines deployment and improves resource management.

## About PipelineStack

- Provisions an AWS CodePipeline that automates the build and deployment of `InfraStack` to the `Prod` environment.
- Pulls source code from GitHub (`master` branch) using an OAuth token stored securely in AWS Secrets Manager.
- Runs a CodeBuild Synth action (`npm ci`, `npm run build`, `npx cdk synth`) to produce the CDK cloud assembly on every push.
- Deploys `InfraStack` as a `Prod` stage via CDK Pipelines, keeping infrastructure changes automated.
- Supports `selfMutation` — the pipeline automatically updates its own definition when pipeline code changes are merged, with no manual redeployment needed.

### Prerequisites

Before deploying `PipelineStack`, ensure the following are in place:

1. **Bootstrap the target environment:**

   ```sh
   cdk bootstrap aws://<account-id>/<region>
   ```

2. **Store your GitHub personal access token in Secrets Manager**

3. **Deploy the pipeline** (one-time manual deploy; self-mutation takes over after):
   ```sh
   cdk deploy PipelineStack
   ```

## Code Quality

This project uses [Prettier](https://prettier.io/) to enforce consistent code formatting, with [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged) ensuring formatting is automatically applied before every commit.

### How it works

#### 1. Prettier — the formatter

Prettier is configured in `.prettierrc` and enforces consistent style rules across all TypeScript files:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

Files and directories excluded from formatting are listed in `.prettierignore` (e.g. `node_modules/`, `cdk.out/`, compiled `.js` and `.d.ts` files).

#### 2. Format on save (editor)

A `.vscode/settings.json` file is included in the repo. It configures VS Code to automatically format on saving files:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

> Requires the [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension, which is already installed.

#### 3. Husky — Git hook runner

Husky registers a `pre-commit` Git hook (`.husky/pre-commit`). Before Git finalizes any commit, it runs:

```sh
npx lint-staged
```

If this script fails, the commit is blocked — preventing unformatted code from ever entering Git history.

#### 4. lint-staged — targeted formatting at commit time

lint-staged runs Prettier only on the `.ts, .js` files staged for a given commit, keeping the process fast:

```json
"lint-staged": {
    "**/*.{ts,js}": ["prettier --write"]
}
```

Prettier rewrites the staged files in place, and lint-staged automatically re-stages the formatted versions before the commit completes.

#### Full commit flow

```
git commit
    │
    ▼
Husky fires pre-commit hook
    │
    ▼
lint-staged checks which .ts files are staged
    │
    ▼
Prettier formats only those files
    │
    ▼
Formatted files are re-staged automatically
    │
    ▼
Commit is saved ✓
```
