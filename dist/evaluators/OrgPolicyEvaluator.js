"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgPolicyEvaluator = void 0;
const Logger_1 = require("../utils/Logger");
const OrgGHASChecks_1 = require("./organization/OrgGHASChecks");
const OrgAuthenticationChecks_1 = require("./organization/OrgAuthenticationChecks");
const OrgCustomRolesChecks_1 = require("./organization/OrgCustomRolesChecks");
const Organization_1 = require("../github/Organization");
const PrivilegesChecks_1 = require("./organization/PrivilegesChecks");
class OrgPolicyEvaluator {
    policy;
    organization;
    orgCheckResults; // The checks to be performed on the repository
    // Constructor
    constructor(org_name, policy) {
        this.policy = policy;
        this.organization = { name: org_name, data: null };
        this.orgCheckResults = [];
    }
    // This method evaluates the policy for the repository
    async evaluatePolicy() {
        Logger_1.logger.info("Running checks for organization policy against: " +
            this.organization.name);
        Logger_1.logger.debug("Organization policy for org: " + this.organization.name);
        // Get the organization data from the API
        this.organization.data = await (0, Organization_1.getOrganization)(this.organization.name);
        // Check MemberPrivileges policy rule
        if (this.policy.member_privileges) {
            const member_privileges = await new PrivilegesChecks_1.PrivilegesChecks(this.organization, this.policy).checkPrivileges();
            Logger_1.logger.debug(`Member privileges results: ${JSON.stringify(member_privileges)}`);
            this.orgCheckResults.push(member_privileges);
        }
        // Check org level GHAS settings
        if (this.policy.advanced_security) {
            const ghas_checks = await new OrgGHASChecks_1.OrgGHASChecks(this.policy, this.organization, this.organization.data).evaluate();
            Logger_1.logger.debug(`Org GHAS results: ${JSON.stringify(ghas_checks)}`);
            this.orgCheckResults.push(ghas_checks);
        }
        // check authentication settings
        if (this.policy.authentication) {
            const authentication_checks = await new OrgAuthenticationChecks_1.OrgAuthenticationChecks(this.policy, this.organization, this.organization.data).evaluate();
            Logger_1.logger.debug(`Org Authentication results: ${JSON.stringify(authentication_checks)}`);
            this.orgCheckResults.push(authentication_checks);
        }
        // check custom repository roles
        if (this.policy.custom_roles) {
            const custom_roles_checks = await new OrgCustomRolesChecks_1.OrgCustomRolesChecks(this.policy, this.organization, this.organization.data).evaluate();
            Logger_1.logger.debug(`Org Custom Roles results: ${JSON.stringify(custom_roles_checks)}`);
            this.orgCheckResults.push(custom_roles_checks);
        }
    }
    printCheckResults() {
        Logger_1.logger.info("------------------------------------------------------------------------");
        Logger_1.logger.info(`Organization policy results - ${this.organization.name}:`);
        Logger_1.logger.info("------------------------------------------------------------------------");
        this.orgCheckResults.forEach((checkResult) => {
            const emoji = checkResult.pass === null ? "😐" : checkResult.pass ? "✅" : "❌";
            Logger_1.logger.info(`[${emoji}] Check: ${checkResult.name} - Pass: ${checkResult.pass} \n${JSON.stringify(checkResult.data, null, 3)}`);
        });
    }
    getCheckResults() {
        return this.orgCheckResults;
    }
    getOrganizationName() {
        return this.organization.name;
    }
}
exports.OrgPolicyEvaluator = OrgPolicyEvaluator;
