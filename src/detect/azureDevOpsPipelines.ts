import { TargetReference, TargetType } from '../types';
import { AzureDevOpsDetectResult } from '../platforms/azureDevOps';
import { GitHubDetectResult } from '../platforms/github';
import { BaseDetector } from './base';
import { DetectError } from '.';

export class AzureDevOpsPipelinesDetector extends BaseDetector {
  detect(): AzureDevOpsDetectResult | GitHubDetectResult {
    try {
      const result = this.detectAzureDevOps();
      if (result) {
        return result;
      }
    } catch (err) {
      if (err.name === DetectError.name) {
        this.logger.debug(err.message);
      } else {
        throw err;
      }
    }

    try {
      const result = this.detectGitHub();
      if (result) {
        return result;
      }
    } catch (err) {
      if (err.name === DetectError.name) {
        this.logger.debug(err.message);
      } else {
        throw err;
      }
    }

    return null;
  }

  detectAzureDevOps(): AzureDevOpsDetectResult {
    this.logger.debug('Checking for Azure DevOps Pipelines');

    this.checkEnvVarValue('BUILD_REPOSITORY_PROVIDER', 'TfsGit');
    const token = this.checkEnvVarExists(process.env.SYSTEM_ACCESSTOKEN, true);
    const repo = this.checkEnvVarExists('BUILD_REPOSITORY_URI');

    let targetType: TargetType;
    let targetRef: TargetReference;

    if (
      this.shouldDetectTargetType('pull-request') ||
      this.shouldDetectTargetType('merge-request')
    ) {
      if (process.env.SYSTEM_PULLREQUEST_PULLREQUESTID) {
        targetType = 'pull-request';
        targetRef = Number.parseInt(
          process.env.SYSTEM_PULLREQUEST_PULLREQUESTID,
          10
        );
        if (Number.isNaN(targetRef)) {
          throw new DetectError(
            `SYSTEM_PULLREQUEST_PULLREQUESTID environment variable is not a valid number`
          );
        }
      }
    }

    if (!targetRef) {
      return null;
    }

    return {
      platform: 'azure-devops',
      project: repo,
      targetType,
      targetRef,
      token,
    };
  }

  detectGitHub(): GitHubDetectResult {
    this.logger.debug('Checking for Azure DevOps Pipelines (GitHub)');

    this.checkEnvVarValue('BUILD_REPOSITORY_PROVIDER', 'GitHub');
    const token = this.checkEnvVarExists('GITHUB_TOKEN', true);
    const repo = this.checkEnvVarExists('BUILD_REPOSITORY_NAME');
    const apiUrl = process.env.GITHUB_API_URL;

    let targetType: TargetType;
    let targetRef: TargetReference;

    if (
      this.shouldDetectTargetType('pull-request') ||
      this.shouldDetectTargetType('merge-request')
    ) {
      if (process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER) {
        targetType = 'pull-request';
        targetRef = Number.parseInt(
          process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER,
          10
        );
        if (Number.isNaN(targetRef)) {
          throw new DetectError(
            `SYSTEM_PULLREQUEST_PULLREQUESTNUMBER environment variable is not a valid number`
          );
        }
      }
    }

    if (!targetRef) {
      return null;
    }

    return {
      platform: 'github',
      project: repo,
      targetType,
      targetRef,
      token,
      apiUrl,
    };
  }
}
