import { CheckResult, Repository } from "../../types/common/main";
import {
  getRepoActionsPermissions,
  getRepoSelectedActions,
} from "../../github/Actions";
import { logger } from "../../utils/logger";

const POLICY_VALUES = ["none", "all", "local_only", "selected"];

export class ActionsChecks {
  private policy: any;
  private repository: Repository;

  constructor(policy: any, repository: Repository) {
    this.policy = policy;
    this.repository = repository;
  }

  async checkActionsPermissions(): Promise<any> {
    const actionsPermissions = await getRepoActionsPermissions(
      this.repository.owner,
      this.repository.name,
    );

    const actionsPermissionsResult = actionsPermissions.enabled;
    const actionsPermissionsAllowedActions = actionsPermissions.allowed_actions;
    const actionsPermissionsPolicy = this.policy.actions.permission;
    const shaPinningRequired = (actionsPermissions as any).sha_pinning_required;
    const shaPinningRequiredPolicy = this.policy.actions.sha_pinning_required;

    if (!actionsPermissionsResult) {
      return this.createResult(
        actionsPermissionsPolicy === "none",
        "none",
        actionsPermissionsPolicy,
        shaPinningRequired,
        shaPinningRequiredPolicy,
      );
    }

    switch (actionsPermissionsPolicy) {
      case "selected":
        if (!this.policy.actions.selected.patterns_allowed) {
          logger.error(
            "error: the policy (.yml) should have the list of patterns_allowed when permission is 'selected'",
          );
          return this.createResult(
            false,
            actionsPermissionsAllowedActions,
            actionsPermissionsPolicy,
            shaPinningRequired,
            shaPinningRequiredPolicy,
          );
        }
        if (actionsPermissionsAllowedActions !== "selected")
          return this.createResult(
            false,
            actionsPermissionsAllowedActions,
            actionsPermissionsPolicy,
            shaPinningRequired,
            shaPinningRequiredPolicy,
          );

        const selectedActions = await getRepoSelectedActions(
          this.repository.owner,
          this.repository.name,
        );
        const githubOwnedAllowedActions = selectedActions.github_owned_allowed;
        const verifiedAllowedActions = selectedActions.verified_allowed;
        const patternsAllowedActions = selectedActions.patterns_allowed;

        const selectedActionsAllowed = selectedActions.patterns_allowed.every(
          (action: string) =>
            this.policy.actions.selected.patterns_allowed.includes(action),
        );
        const githubOwnedAllowedMatchesPolicy =
          this.policy.actions.selected.github_owned_allowed ===
          githubOwnedAllowedActions;
        const verifiedAllowedMatchesPolicy =
          this.policy.actions.selected.verified_allowed ===
          verifiedAllowedActions;

        return this.createResultSelected(
          selectedActionsAllowed,
          actionsPermissionsAllowedActions,
          githubOwnedAllowedMatchesPolicy,
          verifiedAllowedMatchesPolicy,
          patternsAllowedActions,
          this.policy.actions.selected.patterns_allowed,
          shaPinningRequired,
          shaPinningRequiredPolicy,
        );
      case "all":
      case "local_only":
      case "none":
        return this.createResult(
          actionsPermissionsPolicy === actionsPermissionsAllowedActions,
          actionsPermissionsAllowedActions,
          actionsPermissionsPolicy,
          shaPinningRequired,
          shaPinningRequiredPolicy,
        );
      default:
        logger.error(
          `error: invalid policy value '${actionsPermissionsPolicy}'. It should be one of ${POLICY_VALUES.join(", ")}.`,
        );
    }
  }

  private createResult(
    actions_permissions: boolean,
    github_allowed_actions?: string,
    policy_allowed_actions?: string,
    sha_pinning_required?: boolean,
    sha_pinning_required_policy?: boolean,
  ): CheckResult {
    const name = "Actions Check";
    const passed: string[] = [];
    const failed: Record<string, any> = {};

    // Permission comparison
    if (actions_permissions) {
      passed.push("permission");
    } else {
      failed.permission = {
        actual: github_allowed_actions,
        expected: policy_allowed_actions,
      };
    }

    // SHA pinning comparison (only if policy specifies it)
    if (typeof sha_pinning_required_policy === "boolean") {
      if (sha_pinning_required === sha_pinning_required_policy) {
        passed.push("sha_pinning_required");
      } else {
        failed.sha_pinning_required = false;
      }
    }

    const pass = Object.keys(failed).length === 0;
    const data = { passed, failed, info: {} };
    return { name, pass, data };
  }

  private createResultSelected(
    actions_permissions: boolean,
    github_allowed_actions: string,
    github_owned_allowed: boolean,
    verified_allowed: boolean,
    patterns_allowed_github: string[],
    patterns_allowed_policy: string[],
    sha_pinning_required?: boolean,
    sha_pinning_required_policy?: boolean,
  ) {
    const name = "Actions Check";
    const passed: string[] = [];
    const failed: Record<string, any> = {};

    // Permission must be 'selected'
    if (actions_permissions) {
      passed.push("permission");
    } else {
      failed.permission = {
        actual: github_allowed_actions,
        expected: "selected",
      };
    }

    // github_owned_allowed
    if (github_owned_allowed) {
      passed.push("github_owned_allowed");
    } else {
      failed.github_owned_allowed = {
        actual: false,
        expected: true,
      };
    }

    // verified_allowed
    if (verified_allowed) {
      passed.push("verified_allowed");
    } else {
      failed.verified_allowed = {
        actual: false,
        expected: true,
      };
    }

    // patterns_allowed: repo patterns must be subset of policy patterns
    const missing_in_policy = patterns_allowed_github.filter(
      (p) => !patterns_allowed_policy.includes(p),
    );
    if (missing_in_policy.length === 0) {
      passed.push("patterns_allowed");
    } else {
      failed.patterns_allowed = {
        missing_in_policy,
        actual: patterns_allowed_github,
        expected_superset: patterns_allowed_policy,
      };
    }

    // SHA pinning comparison (only if policy specifies it)
    if (typeof sha_pinning_required_policy === "boolean") {
      if (sha_pinning_required === sha_pinning_required_policy) {
        passed.push("sha_pinning_required");
      } else {
        failed.sha_pinning_required = false;
      }
    }

    const pass = Object.keys(failed).length === 0;
    const data = { passed, failed, info: {} };
    return { name, pass, data };
  }

  // check whether the actions used in the workflows declared in a repository use the pinning feature as specified in the policy

  async checkActionsPinning(): Promise<any> {
    /***
     * TODO
     *
     * const workflows = await getRepoWorkflows(this.repository.owner, this.repository.name);
     * const workflowsActions = await getRepoWorkflowActions(...);
     */
  }
}
