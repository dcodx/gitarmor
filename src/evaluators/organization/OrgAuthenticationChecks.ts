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
