"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgGHASChecks = void 0;
const Organization_1 = require("../../github/Organization");
class OrgGHASChecks {
    policy;
    organization;
    organizationData;
    constructor(policy, organization, organizationData) {
        this.policy = policy;
        this.organization = organization;
        this.organizationData = organizationData;
    }
    checkAutomaticDependencyGraph() {
        if (this.policy.advanced_security.automatic_dependency_graph) {
            return (this.organizationData.dependency_graph_enabled_for_new_repositories ===
                this.policy.advanced_security.automatic_dependency_graph);
        }
    }
    checkAutomaticDependabotAlerts() {
        if (this.policy.advanced_security.automatic_dependabot_alerts) {
            return (this.organizationData.dependabot_alerts_enabled_for_new_repositories ===
                this.policy.advanced_security.automatic_dependabot_alerts);
        }
    }
    checkAutomaticDependabotSecurityUpdates() {
        if (this.policy.advanced_security.automatic_dependabot_security_updates) {
            return (this.organizationData
                .dependabot_security_updates_enabled_for_new_repositories ===
                this.policy.advanced_security.automatic_dependabot_security_updates);
        }
    }
    checkAutomaticGHASEnablement() {
        if (this.policy.advanced_security.automatic_ghas_enablement) {
            return (this.organizationData.advanced_security_enabled_for_new_repositories ===
                this.policy.advanced_security.automatic_ghas_enablement);
        }
    }
    checkAutomaticSecretScanning() {
        if (this.policy.advanced_security.automatic_secret_scanning) {
            return (this.organizationData.secret_scanning_enabled_for_new_repositories ===
                this.policy.advanced_security.automatic_secret_scanning);
        }
    }
    checkAutomaticPushProtection() {
        if (this.policy.advanced_security.automatic_push_protection) {
            return (this.organizationData
                .secret_scanning_push_protection_enabled_for_new_repositories ===
                this.policy.advanced_security.automatic_push_protection);
        }
    }
    checkAutomaticSecretScanningValidityCheck() {
        if (this.policy.advanced_security.automatic_secret_scanning_validity_check) {
            return (this.organizationData.secret_scanning_validity_checks_enabled ===
                this.policy.advanced_security.automatic_secret_scanning_validity_check);
        }
    }
    // TODO: codeql and autofix checks are not directly available in the organization data or rest API
    // automatic_codeql_extended: true
    // automatic_codeql_autofix: true
    async checkSecurityManagerTeams() {
        if (this.policy.advanced_security.security_manager_teams) {
            let security_teams = await (0, Organization_1.getSecurityTeamsForOrg)(this.organization.name);
            let policy_teams = this.policy.advanced_security.security_manager_teams;
            let security_team_slugs = security_teams.map((team) => team.slug);
            let result = policy_teams.every((team) => security_team_slugs.includes(team));
            return {
                result,
                teams: {
                    securityTeams: security_team_slugs,
                    policyTeams: policy_teams,
                },
            };
        }
        return { result: true, teams: { securityTeams: [], policyTeams: [] } };
    }
    async evaluate() {
        let checks = {
            automaticDependencyGraph: this.checkAutomaticDependencyGraph(),
            automaticDependabotAlerts: this.checkAutomaticDependabotAlerts(),
            automaticDependabotSecurityUpdates: this.checkAutomaticDependabotSecurityUpdates(),
            automaticGHASEnablement: this.checkAutomaticGHASEnablement(),
            automaticSecretScanning: this.checkAutomaticSecretScanning(),
            automaticPushProtection: this.checkAutomaticPushProtection(),
            automaticSecretScanningValidityCheck: this.checkAutomaticSecretScanningValidityCheck(),
            // automaticCodeqlExtended: this.checkAutomaticCodeQLExtended(),
            // automaticCodeqlAutofix: this.checkAutomaticCodeQLAutofix(),
            securityManagerTeams: false,
        };
        let securityManagerTeamsCheck = await this.checkSecurityManagerTeams();
        checks.securityManagerTeams = securityManagerTeamsCheck.result;
        let name = "Org GHAS Checks";
        let pass = false;
        let data = {
            ...checks,
            securityManagerTeamsTeams: securityManagerTeamsCheck.teams,
        };
        pass = Object.values(checks).every((check) => check === true);
        return { name, pass, data };
    }
}
exports.OrgGHASChecks = OrgGHASChecks;
