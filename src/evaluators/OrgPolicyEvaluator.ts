import { logger } from "../utils/Logger";
import { OrgPolicy, Organization, CheckResult } from "../types/common/main";
import { OrgGHASChecks } from "./organization/OrgGHASChecks";
import { OrgAuthenticationChecks } from "./organization/OrgAuthenticationChecks";
import { OrgCustomRolesChecks } from "./organization/OrgCustomRolesChecks";
import { getOrganization } from "../github/Organization";
import { FilesExistChecks } from "./multipurpose/FilesExistChecks";
import { PrivilegesChecks } from "./organization/PrivilegesChecks";

export class OrgPolicyEvaluator {
  public policy: OrgPolicy;
  private organization: Organization;
  public orgCheckResults: CheckResult[]; // The checks to be performed on the repository

  // Constructor
  constructor(org_name: string, policy: any) {
    this.policy = policy;
    this.organization = { name: org_name, data: null };
    this.orgCheckResults = [];
  }

  // This method evaluates the policy for the repository
  async evaluatePolicy() {
    logger.info(
      "Running checks for organization policy against: " +
        this.organization.name,
    );
    logger.debug("Organization policy for org: " + this.organization.name);

    // Get the organization data from the API
    this.organization.data = await getOrganization(this.organization.name);

    // Check MemberPrivileges policy rule
    if (this.policy.member_privileges) {
      const member_privileges = await new PrivilegesChecks(
        this.organization,
        this.policy,
      ).checkPrivileges();
      logger.debug(
        `Member privileges results: ${JSON.stringify(member_privileges)}`,
      );
      this.orgCheckResults.push(member_privileges);
    }

    // Check org level GHAS settings
    if (this.policy.advanced_security) {
      const ghas_checks = await new OrgGHASChecks(
        this.policy,
        this.organization,
        this.organization.data,
      ).evaluate();
      logger.debug(`Org GHAS results: ${JSON.stringify(ghas_checks)}`);
      this.orgCheckResults.push(ghas_checks);
    }

    // check authentication settings
    if (this.policy.authentication) {
      const authentication_checks = await new OrgAuthenticationChecks(
        this.policy,
        this.organization,
        this.organization.data,
      ).evaluate();
      logger.debug(
        `Org Authentication results: ${JSON.stringify(authentication_checks)}`,
      );
      this.orgCheckResults.push(authentication_checks);
    }

    // check custom repository roles
    if (this.policy.custom_roles) {
      const custom_roles_checks = await new OrgCustomRolesChecks(
        this.policy,
        this.organization,
        this.organization.data,
      ).evaluate();
      logger.debug(
        `Org Custom Roles results: ${JSON.stringify(custom_roles_checks)}`,
      );
      this.orgCheckResults.push(custom_roles_checks);
    }
  }

  public printCheckResults() {
    logger.info(
      "------------------------------------------------------------------------",
    );
    logger.info(`Organization policy results - ${this.organization.name}:`);
    logger.info(
      "------------------------------------------------------------------------",
    );
    this.orgCheckResults.forEach((checkResult) => {
      const emoji =
        checkResult.pass === null ? "😐" : checkResult.pass ? "✅" : "❌";
      logger.info(
        `[${emoji}] Check: ${checkResult.name} - Pass: ${checkResult.pass} \n${JSON.stringify(checkResult.data, null, 3)}`,
      );
    });
  }

  public getCheckResults() {
    return this.orgCheckResults;
  }

  public getOrganizationName() {
    return this.organization.name;
  }
}
