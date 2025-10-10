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

    const checks = {
      enabled_repositories: this.checkEnabledRepositories(
        actionsPermissions.enabled_repositories,
      ),
      allowed_actions: this.checkAllowedActions(
        actionsPermissions.allowed_actions,
      ),
      sha_pinning_required: this.checkShaPinningRequired(
        (actionsPermissions as any).sha_pinning_required,
      ),
    };

    const name = "Org Actions Checks";
    const pass = Object.values(checks).every((check) => check === true);
    const data = {
      enabled_repositories_github: actionsPermissions.enabled_repositories,
      enabled_repositories_policy: this.policy.actions.enabled_repositories,
      allowed_actions_github: actionsPermissions.allowed_actions,
      allowed_actions_policy: this.policy.actions.allowed_actions,
      sha_pinning_required_github: (actionsPermissions as any)
        .sha_pinning_required,
      sha_pinning_required_policy: this.policy.actions.sha_pinning_required,
      ...checks,
    };

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
