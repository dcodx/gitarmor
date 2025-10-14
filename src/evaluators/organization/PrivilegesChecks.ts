import { CheckResult, OrgPolicy, Organization } from "../../types/common/main";

export class PrivilegesChecks {
  private policy: OrgPolicy;
  private organization: Organization;

  constructor(organization: Organization, policy: any) {
    this.policy = policy;
    this.organization = organization;
  }

  async checkPrivileges(): Promise<any> {
    const orgData = this.organization.data;
    const policy = (this.policy.member_privileges || {}) as any;

    // Actual privileges snapshot (fixed incorrect mappings)
    const orgMemberPrivileges = {
      default_repository_permission: orgData.default_repository_permission,
      members_can_create_repositories: orgData.members_can_create_repositories,
      members_can_create_private_repositories:
        orgData.members_can_create_private_repositories,
      members_can_create_internal_repositories:
        orgData.members_can_create_internal_repositories,
      members_can_create_public_repositories:
        orgData.members_can_create_public_repositories,
      members_can_fork_private_repositories:
        orgData.members_can_fork_private_repositories,
      members_can_create_public_pages: orgData.members_can_create_public_pages,
      members_can_create_private_pages:
        orgData.members_can_create_private_pages,
    };

    // Derive sets for comparison
    const actualRepoCreation: string[] = [];
    if (orgMemberPrivileges.members_can_create_private_repositories)
      actualRepoCreation.push("private");
    if (orgMemberPrivileges.members_can_create_internal_repositories)
      actualRepoCreation.push("internal");
    if (orgMemberPrivileges.members_can_create_public_repositories)
      actualRepoCreation.push("public");

    const desiredRepoCreation: string[] = policy.repository_creation || [];

    const actualPagesCreation: string[] = [];
    if (orgMemberPrivileges.members_can_create_public_pages)
      actualPagesCreation.push("public");
    if (orgMemberPrivileges.members_can_create_private_pages)
      actualPagesCreation.push("private");
    const desiredPagesCreation: string[] = policy.pages_creation || [];

    const passed: string[] = [];
    const failed: Record<string, any> = {};
    const info: Record<string, any> = {};

    // base_permission
    if (typeof policy.base_permission === "string") {
      if (
        orgMemberPrivileges.default_repository_permission ===
        policy.base_permission
      ) {
        passed.push("base_permission");
      } else {
        failed.base_permission = {
          actual: orgMemberPrivileges.default_repository_permission,
          expected: policy.base_permission,
        };
      }
    }

    // repository_creation
    if (Array.isArray(desiredRepoCreation)) {
      const sort = (arr: string[]) => [...arr].sort();
      if (
        JSON.stringify(sort(actualRepoCreation)) ===
        JSON.stringify(sort(desiredRepoCreation))
      ) {
        passed.push("repository_creation");
      } else {
        failed.repository_creation = {
          actual: actualRepoCreation,
          expected: desiredRepoCreation,
        };
      }
    }

    // repository_forking
    if (typeof policy.repository_forking === "boolean") {
      if (
        orgMemberPrivileges.members_can_fork_private_repositories ===
        policy.repository_forking
      ) {
        passed.push("repository_forking");
      } else {
        failed.repository_forking = false;
      }
    }

    // pages_creation
    if (Array.isArray(desiredPagesCreation)) {
      const sort = (arr: string[]) => [...arr].sort();
      if (
        JSON.stringify(sort(actualPagesCreation)) ===
        JSON.stringify(sort(desiredPagesCreation))
      ) {
        passed.push("pages_creation");
      } else {
        failed.pages_creation = {
          actual: actualPagesCreation,
          expected: desiredPagesCreation,
        };
      }
    }

    info.actual = orgMemberPrivileges;
    info.policy = {
      base_permission: policy.base_permission,
      repository_creation: desiredRepoCreation,
      repository_forking: policy.repository_forking,
      pages_creation: desiredPagesCreation,
    };

    return this.createResult(passed, failed, info);
  }

  private createResult(
    passed: string[],
    failed: Record<string, any>,
    info: Record<string, any>,
  ): CheckResult {
    const name = "Members Privileges Check";
    const pass = Object.keys(failed).length === 0;
    const data = { passed, failed, info };
    return { name, pass, data };
  }
}
