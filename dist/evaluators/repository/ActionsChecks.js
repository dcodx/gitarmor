"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionsChecks = void 0;
const Actions_1 = require("../../github/Actions");
const logger_1 = require("../../utils/logger");
const POLICY_VALUES = ["none", "all", "local_only", "selected"];
class ActionsChecks {
    policy;
    repository;
    constructor(policy, repository) {
        this.policy = policy;
        this.repository = repository;
    }
    async checkActionsPermissions() {
        const actionsPermissions = await (0, Actions_1.getRepoActionsPermissions)(this.repository.owner, this.repository.name);
        const actionsPermissionsResult = actionsPermissions.enabled;
        const actionsPermissionsAllowedActions = actionsPermissions.allowed_actions;
        const actionsPermissionsPolicy = this.policy.allowed_actions.permission;
        const shaPinningRequired = actionsPermissions.sha_pinning_required;
        const shaPinningRequiredPolicy = this.policy.allowed_actions.sha_pinning_required;
        if (!actionsPermissionsResult) {
            return this.createResult(actionsPermissionsPolicy === "none", "none", actionsPermissionsPolicy, shaPinningRequired, shaPinningRequiredPolicy);
        }
        switch (actionsPermissionsPolicy) {
            case "selected":
                if (!this.policy.allowed_actions.selected.patterns_allowed) {
                    logger_1.logger.error("error: the policy (.yml) should have the list of patterns_allowed when permission is 'selected'");
                    return this.createResult(false, actionsPermissionsAllowedActions, actionsPermissionsPolicy, shaPinningRequired, shaPinningRequiredPolicy);
                }
                if (actionsPermissionsAllowedActions !== "selected")
                    return this.createResult(false, actionsPermissionsAllowedActions, actionsPermissionsPolicy, shaPinningRequired, shaPinningRequiredPolicy);
                const selectedActions = await (0, Actions_1.getRepoSelectedActions)(this.repository.owner, this.repository.name);
                const githubOwnedAllowedActions = selectedActions.github_owned_allowed;
                const verifiedAllowedActions = selectedActions.verified_allowed;
                const patternsAllowedActions = selectedActions.patterns_allowed;
                const selectedActionsAllowed = selectedActions.patterns_allowed.every((action) => this.policy.allowed_actions.selected.patterns_allowed.includes(action));
                const githubOwnedAllowedMatchesPolicy = this.policy.allowed_actions.selected.github_owned_allowed ===
                    githubOwnedAllowedActions;
                const verifiedAllowedMatchesPolicy = this.policy.allowed_actions.selected.verified_allowed ===
                    verifiedAllowedActions;
                return this.createResultSelected(selectedActionsAllowed, actionsPermissionsAllowedActions, githubOwnedAllowedMatchesPolicy, verifiedAllowedMatchesPolicy, patternsAllowedActions, this.policy.allowed_actions.selected.patterns_allowed, shaPinningRequired, shaPinningRequiredPolicy);
            case "all":
            case "local_only":
            case "none":
                return this.createResult(actionsPermissionsPolicy === actionsPermissionsAllowedActions, actionsPermissionsAllowedActions, actionsPermissionsPolicy, shaPinningRequired, shaPinningRequiredPolicy);
            default:
                logger_1.logger.error(`error: invalid policy value '${actionsPermissionsPolicy}'. It should be one of ${POLICY_VALUES.join(", ")}.`);
        }
    }
    createResult(actions_permissions, github_allowed_actions, policy_allowed_actions, sha_pinning_required, sha_pinning_required_policy) {
        let name = "Actions Check";
        let pass = false;
        let data = {};
        // Check sha_pinning_required if it's defined in the policy
        const shaPinningMatches = sha_pinning_required_policy === undefined ||
            sha_pinning_required === sha_pinning_required_policy;
        if (actions_permissions && shaPinningMatches) {
            pass = true;
            data = {
                actions_permissions,
                github_allowed_actions,
                policy_allowed_actions,
                sha_pinning_required,
                sha_pinning_required_policy,
            };
        }
        else {
            data = {
                actions_permissions,
                github_allowed_actions,
                policy_allowed_actions,
                sha_pinning_required,
                sha_pinning_required_policy,
            };
        }
        return { name, pass, data };
    }
    createResultSelected(actions_permissions, github_allowed_actions, github_owned_allowed, verified_allowed, patterns_allowed_github, patterns_allowed_policy, sha_pinning_required, sha_pinning_required_policy) {
        let name = "Actions Check";
        let pass = false;
        let data = {};
        // Check sha_pinning_required if it's defined in the policy
        const shaPinningMatches = sha_pinning_required_policy === undefined ||
            sha_pinning_required === sha_pinning_required_policy;
        if (actions_permissions &&
            github_owned_allowed &&
            verified_allowed &&
            shaPinningMatches) {
            pass = true;
            data = {
                actions_permissions,
                github_allowed_actions,
                github_owned_allowed,
                verified_allowed,
                patterns_allowed_github,
                patterns_allowed_policy,
                sha_pinning_required,
                sha_pinning_required_policy,
            };
        }
        else {
            data = {
                actions_permissions,
                github_allowed_actions,
                github_owned_allowed,
                verified_allowed,
                patterns_allowed_github,
                patterns_allowed_policy,
                sha_pinning_required,
                sha_pinning_required_policy,
            };
        }
        return {
            name,
            pass,
            data,
        };
    }
    // check whether the actions used in the workflows declared in a repository use the pinning feature as specified in the policy
    async checkActionsPinning() {
        /***
         * TODO
         *
         * const workflows = await getRepoWorkflows(this.repository.owner, this.repository.name);
         * const workflowsActions = await getRepoWorkflowActions(...);
         */
    }
}
exports.ActionsChecks = ActionsChecks;
