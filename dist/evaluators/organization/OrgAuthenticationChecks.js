"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgAuthenticationChecks = void 0;
class OrgAuthenticationChecks {
    policy;
    organization;
    organizationData;
    constructor(policy, organization, organizationData) {
        this.policy = policy;
        this.organization = organization;
        this.organizationData = organizationData;
    }
    checkMFARequired() {
        if (this.policy.authentication.mfa_required) {
            return (this.organizationData.two_factor_requirement_enabled ===
                this.policy.authentication.mfa_required);
        }
        return true;
    }
    async evaluate() {
        const name = "Org Authentication Checks";
        const passed = [];
        const failed = {};
        const info = {};
        const desired = this.policy?.authentication?.mfa_required;
        if (typeof desired === "boolean") {
            const actual = !!this.organizationData.two_factor_requirement_enabled;
            if (actual === desired) {
                passed.push("mfa_required");
            }
            else {
                failed.mfa_required = false;
            }
        }
        const pass = Object.keys(failed).length === 0;
        const data = { passed, failed, info };
        return { name, pass, data };
    }
}
exports.OrgAuthenticationChecks = OrgAuthenticationChecks;
