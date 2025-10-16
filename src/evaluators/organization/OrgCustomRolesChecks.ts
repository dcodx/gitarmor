import { Organization, CheckResult } from "../../types/common/main";
import { getCustomRolesForOrg } from "../../github/Organization";

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
    const name = "Org Custom Roles Checks";
    const passed: string[] = [];
    const failed: Record<string, any> = {};
    const info: Record<string, any> = {};

    if (!this.policy.custom_roles || this.policy.custom_roles.length === 0) {
      // Nothing to evaluate
      return { name, pass: true, data: { passed: [], failed: {}, info: {} } };
    }

    const actual = await getCustomRolesForOrg(this.organization.name);
    const actualRoles = actual?.custom_roles || [];
    const actualMap = new Map(actualRoles.map((r: any) => [r.name, r]));

    const missing_roles: string[] = [];
    const mismatched_roles: Array<{
      name: string;
      base_role?: any;
      missing_permissions?: string[];
    }> = [];

    for (const policyRole of this.policy.custom_roles) {
      const match = actualMap.get(policyRole.name);
      if (!match) {
        missing_roles.push(policyRole.name);
        continue;
      }
      const baseRoleMatch = match.base_role === policyRole.base_role;
      const missingPerms = (policyRole.permissions || []).filter(
        (p: string) => !(match.permissions || []).includes(p),
      );
      if (baseRoleMatch && missingPerms.length === 0) {
        // role fully matches policy
        // keep a simple indicator under passed
        passed.push(policyRole.name);
      } else {
        mismatched_roles.push({
          name: policyRole.name,
          base_role: baseRoleMatch ? undefined : match.base_role,
          missing_permissions: missingPerms.length ? missingPerms : undefined,
        });
      }
    }

    if (missing_roles.length > 0) failed.missing_roles = missing_roles;
    if (mismatched_roles.length > 0) failed.mismatched_roles = mismatched_roles;

    const pass = Object.keys(failed).length === 0;
    const data = { passed, failed, info };
    return { name, pass, data };
  }
}
