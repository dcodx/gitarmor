import { get } from "http";
import {
  getRepoDependabotAlerts,
  getRepoDependabotSecurityUpdates,
  getRepositoryCodeScanningAnalysis,
} from "../../github/Repositories";
import { Repository, CheckResult } from "../../types/common/main";
import { logger } from "../../utils/Logger";

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
    if (this.policy.advanced_security.ghas) {
      return this.getStatusForFeature("advanced_security");
    }
  }

  private checkRepositorySecretScanning() {
    if (this.policy.advanced_security.secret_scanning) {
      return this.getStatusForFeature("secret_scanning");
    }
  }

  private checkRepositorySecretScanningPushProtection() {
    if (this.policy.advanced_security.secret_scanning_push_protection) {
      return this.getStatusForFeature("secret_scanning_push_protection");
    }
  }

  private checkRepositorySecretScanningValidityChecks() {
    if (this.policy.advanced_security.secret_scanning_validity_check) {
      return this.getStatusForFeature("secret_scanning_validity_checks");
    }
  }

  private async checkRepositoryCodeScanning() {
    try {
      if (this.policy.advanced_security.code_scanning) {
        const recentAnalysis = await getRepositoryCodeScanningAnalysis(
          this.repository.owner,
          this.repository.name,
        );

        if (recentAnalysis.length > 0) {
          return true;
        }
      }
      return false;
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
    if (this.policy.advanced_security.dependabot_alerts) {
      const dependabot = await getRepoDependabotAlerts(
        this.repository.owner,
        this.repository.name,
      );
      if (dependabot) {
        return true;
      } else {
        return false;
      }
    }
  }

  private async checkRepositoryDependabotSecurityUpdates() {
    if (this.policy.advanced_security.dependabot_security_updates) {
      const dependabotSecurityUpdates = await getRepoDependabotSecurityUpdates(
        this.repository.owner,
        this.repository.name,
      );
      if (dependabotSecurityUpdates) {
        return true;
      } else {
        return false;
      }
    }
  }

  public async evaluate(): Promise<CheckResult> {
    const checks = {
      ghas: this.checkRepositoryGHASstatus(),
      secret_scanning: this.checkRepositorySecretScanning(),
      secret_scanning_push_protection:
        this.checkRepositorySecretScanningPushProtection(),
      secret_scanning_validity_check:
        this.checkRepositorySecretScanningValidityChecks(),
      code_scanning: await this.checkRepositoryCodeScanning(),
      dependabot: await this.checkRepositoryDependabotAlerts(),
      dependabot_security_updates:
        await this.checkRepositoryDependabotSecurityUpdates(),
    };

    let name = "GHAS Checks";
    let pass = false;
    let data = {};
    pass = Object.values(checks).every((check) => check === true);
    data = checks;

    return { name, pass, data };
  }
}
