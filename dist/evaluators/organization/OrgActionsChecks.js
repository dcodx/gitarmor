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
        const name = "Org Actions Checks";
        const passed = [];
        const failed = {};
        const info = {};
        const policy = this.policy?.actions || {};
        if (policy.enabled_repositories !== undefined) {
            if (actionsPermissions.enabled_repositories === policy.enabled_repositories) {
                passed.push("enabled_repositories");
            }
            else {
                failed.enabled_repositories = {
                    actual: actionsPermissions.enabled_repositories,
                    expected: policy.enabled_repositories,
                };
            }
        }
        if (policy.allowed_actions !== undefined) {
            if (actionsPermissions.allowed_actions === policy.allowed_actions) {
                passed.push("allowed_actions");
            }
            else {
                failed.allowed_actions = {
                    actual: actionsPermissions.allowed_actions,
                    expected: policy.allowed_actions,
                };
            }
        }
        if (typeof policy.sha_pinning_required === "boolean") {
            const actualShaPinning = actionsPermissions
                .sha_pinning_required;
            if (actualShaPinning === policy.sha_pinning_required) {
                passed.push("sha_pinning_required");
            }
            else {
                failed.sha_pinning_required = false;
            }
        }
        const pass = Object.keys(failed).length === 0;
        const data = { passed, failed, info };
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
