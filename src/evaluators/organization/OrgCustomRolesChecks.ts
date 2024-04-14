import { Organization, CheckResult } from "../../types/common/main";
import { getCustomRolesForOrg } from "../../github/Organization";
import { logger } from "../../utils/Logger";

export class OrgCustomRolesChecks {
  private policy: any;
  private organization: Organization;
  private organizationData: any;

  constructor(policy: any, organization: Organization, organizationData: any) {
    this.policy = policy;
    this.organization = organization;
    this.organizationData = organizationData;
  }

  private async checkCustomRoles(): Promise<boolean> {
    if (this.policy.custom_roles) {
      let customRoles = await getCustomRolesForOrg(this.organization.name);
      if (!customRoles || !customRoles.custom_roles) {
        return false;
      }
      for (let policyRole of this.policy.custom_roles) {
        let matchingRole = customRoles.custom_roles.find(
          (role) => role.name === policyRole.name,
        );
        if (
          !matchingRole ||
          matchingRole.base_role !== policyRole.base_role ||
          !this.checkPermissions(
            matchingRole.permissions,
            policyRole.permissions,
          )
        ) {
          return false;
        }
      }
    }
    return true;
  }

  private checkPermissions(
    actualPermissions: string[],
    requiredPermissions: string[],
  ): boolean {
    for (let requiredPermission of requiredPermissions) {
      if (!actualPermissions.includes(requiredPermission)) {
        return false;
      }
    }
    return true;
  }

  public async evaluate(): Promise<CheckResult> {
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
