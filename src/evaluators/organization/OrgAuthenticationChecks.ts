import { Organization, CheckResult } from "../../types/common/main";

export class OrgAuthenticationChecks {
  private policy: any;
  private organization: Organization;
  private organizationData: any;

  constructor(policy: any, organization: any, organizationData: any) {
    this.policy = policy;
    this.organization = organization;
    this.organizationData = organizationData;
  }

  private checkMFARequired(): boolean {
    if (this.policy.authentication.mfa_required) {
      return (
        this.organizationData.two_factor_requirement_enabled ===
        this.policy.authentication.mfa_required
      );
    }
    return true;
  }

  public async evaluate(): Promise<CheckResult> {
    const name = "Org Authentication Checks";
    const passed: string[] = [];
    const failed: Record<string, any> = {};
    const info: Record<string, any> = {};

    const desired = this.policy?.authentication?.mfa_required;
    if (typeof desired === "boolean") {
      const actual = !!this.organizationData.two_factor_requirement_enabled;
      if (actual === desired) {
        passed.push("mfa_required");
      } else {
        failed.mfa_required = false;
      }
    }

    const pass = Object.keys(failed).length === 0;
    const data = { passed, failed, info };
    return { name, pass, data };
  }
}
