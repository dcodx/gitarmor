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
        let checks = {
            customRoles: await this.checkCustomRoles(),
        };
        let name = "Org Custom Roles Checks";
        let pass = false;
        let data = {};
        pass = Object.values(checks).every((check) => check === true);
        data = checks;
        return { name, pass, data };
    }
}
exports.OrgCustomRolesChecks = OrgCustomRolesChecks;
