import { Organization, CheckResult } from "../../types/common/main";
import { getSecurityTeamsForOrg } from "../../github/Organization";

export class OrgGHASChecks {
  private policy: any;
  private organization: Organization;
  private organizationData: any;

  constructor(policy: any, organization: Organization, organizationData: any) {
    this.policy = policy;
    this.organization = organization;
    this.organizationData = organizationData;
  }

  private checkAutomaticDependencyGraph(): boolean {
    if (this.policy.advanced_security.automatic_dependency_graph) {
      return (
        this.organizationData.dependency_graph_enabled_for_new_repositories ===
        this.policy.advanced_security.automatic_dependency_graph
      );
    }
  }

  private checkAutomaticDependabotAlerts(): boolean {
    if (this.policy.advanced_security.automatic_dependabot_alerts) {
      return (
        this.organizationData.dependabot_alerts_enabled_for_new_repositories ===
        this.policy.advanced_security.automatic_dependabot_alerts
      );
    }
  }

  private checkAutomaticDependabotSecurityUpdates(): boolean {
    if (this.policy.advanced_security.automatic_dependabot_security_updates) {
      return (
        this.organizationData
          .dependabot_security_updates_enabled_for_new_repositories ===
        this.policy.advanced_security.automatic_dependabot_security_updates
      );
    }
  }

  private checkAutomaticGHASEnablement(): boolean {
    if (this.policy.advanced_security.automatic_ghas_enablement) {
      return (
        this.organizationData.advanced_security_enabled_for_new_repositories ===
        this.policy.advanced_security.automatic_ghas_enablement
      );
    }
  }

  private checkAutomaticSecretScanning(): boolean {
    if (this.policy.advanced_security.automatic_secret_scanning) {
      return (
        this.organizationData.secret_scanning_enabled_for_new_repositories ===
        this.policy.advanced_security.automatic_secret_scanning
      );
    }
  }

  private checkAutomaticPushProtection(): boolean {
    if (this.policy.advanced_security.automatic_push_protection) {
      return (
        this.organizationData
          .secret_scanning_push_protection_enabled_for_new_repositories ===
        this.policy.advanced_security.automatic_push_protection
      );
    }
  }

  private checkAutomaticSecretScanningValidityCheck(): boolean {
    if (
      this.policy.advanced_security.automatic_secret_scanning_validity_check
    ) {
      return (
        this.organizationData.secret_scanning_validity_checks_enabled ===
        this.policy.advanced_security.automatic_secret_scanning_validity_check
      );
    }
  }

  // TODO: codeql and autofix checks are not directly available in the organization data or rest API
  // automatic_codeql_extended: true
  // automatic_codeql_autofix: true

  private async checkSecurityManagerTeams(): Promise<{
    result: boolean;
    teams: { securityTeams: string[]; policyTeams: string[] };
  }> {
    if (this.policy.advanced_security.security_manager_teams) {
      let security_teams = await getSecurityTeamsForOrg(this.organization.name);
      let policy_teams = this.policy.advanced_security.security_manager_teams;
      let security_team_slugs = security_teams.map((team) => team.slug);

      let result = policy_teams.every((team) =>
        security_team_slugs.includes(team),
      );
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

  public async evaluate(): Promise<CheckResult> {
    const name = "Org GHAS Checks";
    const passed: string[] = [];
    const failed: Record<string, any> = {};
    const info: Record<string, any> = {};

    const desired = this.policy?.advanced_security || {};

    const compare = (
      key: string,
      actual: boolean | undefined,
      expected: any,
    ) => {
      if (typeof expected !== "boolean") return; // not declared in policy
      if (actual === expected) passed.push(key);
      else failed[key] = false;
    };

    compare(
      "automatic_dependency_graph",
      this.organizationData.dependency_graph_enabled_for_new_repositories,
      desired.automatic_dependency_graph,
    );
    compare(
      "automatic_dependabot_alerts",
      this.organizationData.dependabot_alerts_enabled_for_new_repositories,
      desired.automatic_dependabot_alerts,
    );
    compare(
      "automatic_dependabot_security_updates",
      this.organizationData
        .dependabot_security_updates_enabled_for_new_repositories,
      desired.automatic_dependabot_security_updates,
    );
    compare(
      "automatic_ghas_enablement",
      this.organizationData.advanced_security_enabled_for_new_repositories,
      desired.automatic_ghas_enablement,
    );
    compare(
      "automatic_secret_scanning",
      this.organizationData.secret_scanning_enabled_for_new_repositories,
      desired.automatic_secret_scanning,
    );
    compare(
      "automatic_push_protection",
      this.organizationData
        .secret_scanning_push_protection_enabled_for_new_repositories,
      desired.automatic_push_protection,
    );
    compare(
      "automatic_secret_scanning_validity_check",
      this.organizationData.secret_scanning_validity_checks_enabled,
      desired.automatic_secret_scanning_validity_check,
    );

    const securityManagerTeamsCheck = await this.checkSecurityManagerTeams();
    if (
      Array.isArray(desired.security_manager_teams) &&
      desired.security_manager_teams.length > 0
    ) {
      if (securityManagerTeamsCheck.result)
        passed.push("security_manager_teams");
      else
        failed.security_manager_teams = {
          policy_teams: desired.security_manager_teams,
          actual_teams: securityManagerTeamsCheck.teams.securityTeams,
        };
    }
    info.security_manager_teams_details = securityManagerTeamsCheck.teams;

    const pass = Object.keys(failed).length === 0;
    const data = { passed, failed, info };
    return { name, pass, data };
  }
}
