"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgCustomRolesChecks = void 0;
const Organization_1 = require("../../github/Organization");
class OrgCustomRolesChecks {
    policy;
    organization;
    organizationData;
    constructor(policy, organization, organizationData) {
        this.policy = policy;
        this.organization = organization;
        this.organizationData = organizationData;
    }
    async checkCustomRoles() {
        if (this.policy.custom_roles) {
            let customRoles = await (0, Organization_1.getCustomRolesForOrg)(this.organization.name);
            if (!customRoles || !customRoles.custom_roles) {
                return false;
            }
            for (let policyRole of this.policy.custom_roles) {
                let matchingRole = customRoles.custom_roles.find((role) => role.name === policyRole.name);
                if (!matchingRole ||
                    matchingRole.base_role !== policyRole.base_role ||
                    !this.checkPermissions(matchingRole.permissions, policyRole.permissions)) {
                    return false;
                }
            }
        }
        return true;
    }
    checkPermissions(actualPermissions, requiredPermissions) {
        for (let requiredPermission of requiredPermissions) {
            if (!actualPermissions.includes(requiredPermission)) {
                return false;
            }
        }
        return true;
    }
    async evaluate() {
        const name = "Org Custom Roles Checks";
        const passed = [];
        const failed = {};
        const info = {};
        if (!this.policy.custom_roles || this.policy.custom_roles.length === 0) {
            // Nothing to evaluate
            return { name, pass: true, data: { passed: [], failed: {}, info: {} } };
        }
        const actual = await (0, Organization_1.getCustomRolesForOrg)(this.organization.name);
        const actualRoles = actual?.custom_roles || [];
        const actualMap = new Map(actualRoles.map((r) => [r.name, r]));
        const missing_roles = [];
        const mismatched_roles = [];
        for (const policyRole of this.policy.custom_roles) {
            const match = actualMap.get(policyRole.name);
            if (!match) {
                missing_roles.push(policyRole.name);
                continue;
            }
            const baseRoleMatch = match.base_role === policyRole.base_role;
            const missingPerms = (policyRole.permissions || []).filter((p) => !(match.permissions || []).includes(p));
            if (baseRoleMatch && missingPerms.length === 0) {
                // role fully matches policy
                // keep a simple indicator under passed
                passed.push(policyRole.name);
            }
            else {
                mismatched_roles.push({
                    name: policyRole.name,
                    base_role: baseRoleMatch ? undefined : match.base_role,
                    missing_permissions: missingPerms.length ? missingPerms : undefined,
                });
            }
        }
        if (missing_roles.length > 0)
            failed.missing_roles = missing_roles;
        if (mismatched_roles.length > 0)
            failed.mismatched_roles = mismatched_roles;
        const pass = Object.keys(failed).length === 0;
        const data = { passed, failed, info };
        return { name, pass, data };
    }
}
exports.OrgCustomRolesChecks = OrgCustomRolesChecks;
