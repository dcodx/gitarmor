"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminsChecks = void 0;
const Repositories_1 = require("../../github/Repositories");
class AdminsChecks {
    policy;
    repository;
    constructor(policy, repository) {
        this.policy = policy;
        this.repository = repository;
    }
    // check whether the repository admins match the policy
    async checkAdmins() {
        const collaborators = await (0, Repositories_1.getRepoCollaborators)(this.repository.owner, this.repository.name);
        // Filter collaborators to get only admins
        const actualAdmins = collaborators
            .filter((collaborator) => collaborator.permissions?.admin)
            .map((collaborator) => collaborator.login);
        const policyAdmins = this.policy.admins || [];
        // Find admins in policy that are not in the repository
        const missingAdmins = policyAdmins.filter((admin) => !actualAdmins.includes(admin));
        // Find admins in the repository that are not in the policy
        const extraAdmins = actualAdmins.filter((admin) => !policyAdmins.includes(admin));
        return this.createResult(policyAdmins, actualAdmins, missingAdmins, extraAdmins);
    }
    createResult(policy_admins, actual_admins, missing_admins, extra_admins) {
        const name = "Admins Check";
        const pass = missing_admins.length === 0 && extra_admins.length === 0;
        const data = {
            passed: policy_admins.filter((a) => actual_admins.includes(a)),
            failed: {
                missing_admins,
                extra_admins,
            },
            info: {
                policy_admins,
                actual_admins,
            },
        };
        return { name, pass, data };
    }
}
exports.AdminsChecks = AdminsChecks;
