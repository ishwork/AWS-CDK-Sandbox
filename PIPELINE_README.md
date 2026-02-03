# AWS CDK Pipeline Setup

This document explains the CI/CD pipeline setup for the AWS-CDK-Sandbox project.

## Overview

The pipeline automatically deploys infrastructure changes when code is pushed to the master branch of the AWS-CDK-Sandbox repository using AWS CDK Pipelines.

## Architecture

The pipeline consists of three main components:

1. **Pipeline.ts**: A reusable construct that creates a self-mutating CDK pipeline using the modern `aws-cdk-lib/pipelines` library
2. **PipelineStack.ts**: The CDK stack that instantiates the Pipeline construct and deploys InfraStack as a 'Prod' stage
3. **AppStack.ts**: The main application entry point that creates the PipelineStack

## Pipeline Stages

1. **Source Stage**: Monitors the GitHub repository for changes on the master branch using GitHub webhooks
2. **Build/Synth Stage**: 
   - Installs dependencies with `npm ci`
   - Runs TypeScript compilation with `npm run build`
   - Synthesizes CDK templates with `npx cdk synth`
3. **UpdatePipeline Stage**: Self-mutates the pipeline if pipeline code has changed
4. **Prod Stage**: Deploys the InfraStack to AWS

## Prerequisites

Before deploying the pipeline, you need to:

1. **Create a GitHub Personal Access Token**:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate a new token with `repo` and `admin:repo_hook` permissions
   - Store the token in AWS Secrets Manager

2. **Store the GitHub Token in AWS Secrets Manager**:

## Environment Variables

The pipeline uses CDK's default environment variables in `.env` file. Set these before deployment:

```env
CDK_DEFAULT_ACCOUNT=your-aws-account-id
CDK_DEFAULT_REGION=eu-west-1
```

**Note**: GitHub repository configuration is handled internally by the Pipeline construct. By default, it uses:
- **Repository**: `AWS-CDK-Sandbox`
- **GitHub Account**: `ishwork`
- **Branch**: `master`
- **Token Secret**: `github-access-token`