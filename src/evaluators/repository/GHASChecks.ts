import { get } from "http";
import {
  getRepoDependabotAlerts,
  getRepoDependabotSecurityUpdates,
  getRepositoryCodeScanningAnalysis,
} from "../../github/Repositories";
import { Repository, CheckResult } from "../../types/common/main";
import { logger } from "../../utils/logger";

export class GHASChecks {
  private policy: any;
  private repository: Repository;
  private repositoryData: any;

  constructor(policy: any, repository: Repository, repositoryData: any) {
    this.policy = policy;
    this.repository = repository;
    this.repositoryData = repositoryData;
  }

  private checkRepositoryGHASstatus() {
    logger.debug(
      `Checking GHAS status for ${this.repository.owner}/${this.repository.name}`,
    );
    return this.getStatusForFeature("advanced_security");
  }

  private checkRepositorySecretScanning() {
    return this.getStatusForFeature("secret_scanning");
  }

  private checkRepositorySecretScanningPushProtection() {
    return this.getStatusForFeature("secret_scanning_push_protection");
  }

  private checkRepositorySecretScanningValidityChecks() {
    return this.getStatusForFeature("secret_scanning_validity_checks");
  }

  private async checkRepositoryCodeScanning() {
    try {
      const recentAnalysis = await getRepositoryCodeScanningAnalysis(
        this.repository.owner,
        this.repository.name,
      );
      return recentAnalysis.length > 0;
    } catch (error) {
      throw new Error(`Error in checkRepositoryCodeScanning: ${error}`);
    }
  }

  private getStatusForFeature(feature: string): boolean {
    try {
      if (!this.repositoryData.organization) {
        if (this.repositoryData.private) {
          return false;
        } else {
          if (feature === "advanced_security") {
            return true;
          }
        }
      }
      if (this.repositoryData.security_and_analysis) {
        const status =
          this.repositoryData.security_and_analysis[feature]?.status;
        return status === "enabled";
      }
      return false;
    } catch (error) {
      throw new Error(`Error in getStatusForFeature: ${error}`);
    }
  }

  private async checkRepositoryDependabotAlerts() {
    const dependabot = await getRepoDependabotAlerts(
      this.repository.owner,
      this.repository.name,
    );
    return !!dependabot;
  }

  private async checkRepositoryDependabotSecurityUpdates() {
    const dependabotSecurityUpdates = await getRepoDependabotSecurityUpdates(
      this.repository.owner,
      this.repository.name,
    );
    return !!dependabotSecurityUpdates;
  }

  public async evaluate(): Promise<CheckResult> {
    const asPolicy = this.policy?.advanced_security || {};

    const evaluators: Record<string, () => Promise<boolean> | boolean> = {
      ghas: () => this.checkRepositoryGHASstatus(),
      secret_scanning: () => this.checkRepositorySecretScanning(),
      secret_scanning_push_protection: () =>
        this.checkRepositorySecretScanningPushProtection(),
      secret_scanning_validity_check: () =>
        this.checkRepositorySecretScanningValidityChecks(),
      code_scanning: () => this.checkRepositoryCodeScanning(),
      dependabot_alerts: () => this.checkRepositoryDependabotAlerts(),
      dependabot_security_updates: () =>
        this.checkRepositoryDependabotSecurityUpdates(),
    };

    const keysToEvaluate = Object.keys(asPolicy).filter(
      (k) => k in evaluators && typeof asPolicy[k] === "boolean",
    );

    const passed: string[] = [];
    const failed: string[] = [];

    await Promise.all(
      keysToEvaluate.map(async (key) => {
        try {
          const actual = await evaluators[key]();
          const desired = !!asPolicy[key];
          if (actual === desired) {
            passed.push(key);
          } else {
            failed.push(key);
          }
        } catch (e) {
          failed.push(key);
          logger.debug(`GHAS check error for ${key}: ${e}`);
        }
      }),
    );

    const name = "GHAS Checks";
    const pass = failed.length === 0;
    const data = { passed, failed, info: {} };

    return { name, pass, data };
  }
}
