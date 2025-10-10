import { CheckResult, Repository } from "../../types/common/main";
import { getRepoCollaborators } from "../../github/Repositories";

export class AdminsChecks {
  private policy: any;
  private repository: Repository;

  constructor(policy: any, repository: Repository) {
    this.policy = policy;
    this.repository = repository;
  }

  // check whether the repository admins match the policy
  async checkAdmins(): Promise<any> {
    const collaborators = await getRepoCollaborators(
      this.repository.owner,
      this.repository.name,
    );

    // Filter collaborators to get only admins
    const actualAdmins = collaborators
      .filter((collaborator) => collaborator.permissions?.admin)
      .map((collaborator) => collaborator.login);

    const policyAdmins = this.policy.admins || [];

    // Find admins in policy that are not in the repository
    const missingAdmins = policyAdmins.filter(
      (admin: string) => !actualAdmins.includes(admin),
    );

    // Find admins in the repository that are not in the policy
    const extraAdmins = actualAdmins.filter(
      (admin) => !policyAdmins.includes(admin),
    );

    return this.createResult(
      policyAdmins,
      actualAdmins,
      missingAdmins,
      extraAdmins,
    );
  }

  private createResult(
    policy_admins: string[],
    actual_admins: string[],
    missing_admins: string[],
    extra_admins: string[],
  ): CheckResult {
    let name = "Admins Check";
    let pass = false;
    let data = {};

    if (missing_admins.length === 0 && extra_admins.length === 0) {
      pass = true;
      data = {
        policy_admins,
        actual_admins,
      };
    } else {
      data = {
        policy_admins,
        actual_admins,
        missing_admins,
        extra_admins,
      };
    }

    return { name, pass, data };
  }
}
