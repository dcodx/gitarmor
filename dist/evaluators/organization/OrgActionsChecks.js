"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgActionsChecks = void 0;
const Actions_1 = require("../../github/Actions");
class OrgActionsChecks {
    policy;
    organization;
    constructor(policy, organization) {
        this.policy = policy;
        this.organization = organization;
    }
    async evaluate() {
        const actionsPermissions = await (0, Actions_1.getOrgActionsPermissions)(this.organization.name);
        const checks = {
            enabled_repositories: this.checkEnabledRepositories(actionsPermissions.enabled_repositories),
            allowed_actions: this.checkAllowedActions(actionsPermissions.allowed_actions),
            sha_pinning_required: this.checkShaPinningRequired(actionsPermissions.sha_pinning_required),
        };
        const name = "Org Actions Checks";
        const pass = Object.values(checks).every((check) => check === true);
        const data = {
            enabled_repositories_github: actionsPermissions.enabled_repositories,
            enabled_repositories_policy: this.policy.actions.enabled_repositories,
            allowed_actions_github: actionsPermissions.allowed_actions,
            allowed_actions_policy: this.policy.actions.allowed_actions,
            sha_pinning_required_github: actionsPermissions
                .sha_pinning_required,
            sha_pinning_required_policy: this.policy.actions.sha_pinning_required,
            ...checks,
        };
        return { name, pass, data };
    }
    checkEnabledRepositories(githubValue) {
        if (this.policy.actions.enabled_repositories === undefined) {
            return true;
        }
        return githubValue === this.policy.actions.enabled_repositories;
    }
    checkAllowedActions(githubValue) {
        if (this.policy.actions.allowed_actions === undefined) {
            return true;
        }
        return githubValue === this.policy.actions.allowed_actions;
    }
    checkShaPinningRequired(githubValue) {
        if (this.policy.actions.sha_pinning_required === undefined) {
            return true;
        }
        return githubValue === this.policy.actions.sha_pinning_required;
    }
}
exports.OrgActionsChecks = OrgActionsChecks;
