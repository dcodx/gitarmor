import { Organization, CheckResult } from "../../types/common/main";
import { getOrgActionsPermissions } from "../../github/Actions";
import { logger } from "../../utils/logger";

export class OrgActionsChecks {
  private policy: any;
  private organization: Organization;

  constructor(policy: any, organization: Organization) {
    this.policy = policy;
    this.organization = organization;
  }

  public async evaluate(): Promise<CheckResult> {
    const actionsPermissions = await getOrgActionsPermissions(
      this.organization.name,
    );
    const name = "Org Actions Checks";
    const passed: string[] = [];
    const failed: Record<string, any> = {};
    const info: Record<string, any> = {};

    const policy = this.policy?.actions || {};

    if (policy.enabled_repositories !== undefined) {
      if (
        actionsPermissions.enabled_repositories === policy.enabled_repositories
      ) {
        passed.push("enabled_repositories");
      } else {
        failed.enabled_repositories = {
          actual: actionsPermissions.enabled_repositories,
          expected: policy.enabled_repositories,
        };
      }
    }

    if (policy.allowed_actions !== undefined) {
      if (actionsPermissions.allowed_actions === policy.allowed_actions) {
        passed.push("allowed_actions");
      } else {
        failed.allowed_actions = {
          actual: actionsPermissions.allowed_actions,
          expected: policy.allowed_actions,
        };
      }
    }

    if (typeof policy.sha_pinning_required === "boolean") {
      const actualShaPinning = (actionsPermissions as any)
        .sha_pinning_required as boolean | undefined;
      if (actualShaPinning === policy.sha_pinning_required) {
        passed.push("sha_pinning_required");
      } else {
        failed.sha_pinning_required = false;
      }
    }

    const pass = Object.keys(failed).length === 0;
    const data = { passed, failed, info };
    return { name, pass, data };
  }

  private checkEnabledRepositories(githubValue: string | undefined): boolean {
    if (this.policy.actions.enabled_repositories === undefined) {
      return true;
    }
    return githubValue === this.policy.actions.enabled_repositories;
  }

  private checkAllowedActions(githubValue: string | undefined): boolean {
    if (this.policy.actions.allowed_actions === undefined) {
      return true;
    }
    return githubValue === this.policy.actions.allowed_actions;
  }

  private checkShaPinningRequired(githubValue: boolean | undefined): boolean {
    if (this.policy.actions.sha_pinning_required === undefined) {
      return true;
    }
    return githubValue === this.policy.actions.sha_pinning_required;
  }
}
