import { CheckResult, Repository } from "../../types/common/main";
import {
  getRepoActionsPermissions,
  getRepoSelectedActions,
} from "../../github/Actions";
import { logger } from "../../utils/Logger";

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
    const actionsPermissionsPolicy = this.policy.allowed_actions.permission;

    if (!actionsPermissionsResult) {
      return this.createResult(
        actionsPermissionsPolicy === "none",
        "none",
        actionsPermissionsPolicy,
      );
    }

    switch (actionsPermissionsPolicy) {
      case "selected":
        if (!this.policy.allowed_actions.selected.patterns_allowed) {
          logger.error(
            "error: the policy (.yml) should have the list of patterns_allowed when permission is 'selected'",
          );
          return this.createResult(
            false,
            actionsPermissionsAllowedActions,
            actionsPermissionsPolicy,
          );
        }
        if (actionsPermissionsAllowedActions !== "selected")
          return this.createResult(
            false,
            actionsPermissionsAllowedActions,
            actionsPermissionsPolicy,
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
            this.policy.allowed_actions.selected.patterns_allowed.includes(
              action,
            ),
        );
        const githubOwnedAllowedMatchesPolicy =
          this.policy.allowed_actions.selected.github_owned_allowed ===
          githubOwnedAllowedActions;
        const verifiedAllowedMatchesPolicy =
          this.policy.allowed_actions.selected.verified_allowed ===
          verifiedAllowedActions;

        return this.createResultSelected(
          selectedActionsAllowed,
          actionsPermissionsAllowedActions,
          githubOwnedAllowedMatchesPolicy,
          verifiedAllowedMatchesPolicy,
          patternsAllowedActions,
          this.policy.allowed_actions.selected.patterns_allowed,
        );
      case "all":
      case "local_only":
      case "none":
        return this.createResult(
          actionsPermissionsPolicy === actionsPermissionsAllowedActions,
          actionsPermissionsAllowedActions,
          actionsPermissionsPolicy,
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
  ): CheckResult {
    let name = "Actions Check";
    let pass = false;
    let data = {};

    if (actions_permissions) {
      pass = true;
      data = {
        actions_permissions,
        github_allowed_actions,
        policy_allowed_actions,
      };
    } else {
      data = {
        actions_permissions,
        github_allowed_actions,
        policy_allowed_actions,
      };
    }

    return { name, pass, data };
  }

  private createResultSelected(
    actions_permissions: boolean,
    github_allowed_actions: string,
    github_owned_allowed: boolean,
    verified_allowed: boolean,
    patterns_allowed_github: string[],
    patterns_allowed_policy: string[],
  ) {
    let name = "Actions Check";
    let pass = false;
    let data = {};

    if (actions_permissions && github_owned_allowed && verified_allowed) {
      pass = true;
      data = {
        actions_permissions,
        github_allowed_actions,
        github_owned_allowed,
        verified_allowed,
        patterns_allowed_github,
        patterns_allowed_policy,
      };
    } else {
      data = {
        actions_permissions,
        github_allowed_actions,
        github_owned_allowed,
        verified_allowed,
        patterns_allowed_github,
        patterns_allowed_policy,
      };
    }

    return {
      name,
      pass,
      data,
    };
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
