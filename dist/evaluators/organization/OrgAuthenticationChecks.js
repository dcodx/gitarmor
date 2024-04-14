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
        let checks = {
            mfaRequired: this.checkMFARequired(),
        };
        let name = "Org Authentication Checks";
        let pass = false;
        let data = {};
        pass = Object.values(checks).every((check) => check === true);
        data = checks;
        return { name, pass, data };
    }
}
exports.OrgAuthenticationChecks = OrgAuthenticationChecks;
