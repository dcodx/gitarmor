import { CheckResult, Repository } from "../../types/common/main";
import { getRepoRunners } from "../../github/Runners";
import { logger } from "../../utils/logger";

export class RunnersChecks {
  private policy: any;
  private repository: Repository;

  constructor(policy: any, repository: Repository) {
    this.policy = policy;
    this.repository = repository;
  }

  // check whether the repository has self hosted runners enabled
  async checkRunnersPermissions(): Promise<any> {
    const runners = await getRepoRunners(
      this.repository.owner,
      this.repository.name,
    );

    const runnersAllowed = this.policy.runners.self_hosted_allowed
      ? true
      : runners.total_count === 0;
    const runnersPolicySelfHostedOs =
      this.policy.runners.self_hosted_allowed_os;

    const notAllowedOs = [];
    //for each runner in runners check if the os is one of the allowed os in the policy, if not return false

    if (
      runnersPolicySelfHostedOs !== undefined &&
      Array.isArray(runnersPolicySelfHostedOs)
    ) {
      runners.runners.forEach((runner) => {
        if (!runnersPolicySelfHostedOs.includes(runner.os)) {
          notAllowedOs.push(runner);
        }
      });
    }

    return this.createResult(runnersAllowed, runners.total_count, notAllowedOs);
  }

  private createResult(
    self_hosted_runners: boolean,
    self_hosted_runners_defined: number,
    self_hosted_runners_os_not_allowed?: any,
  ): CheckResult {
    let name = "Runners Check";
    let pass = false;
    let data = {};

    if (
      self_hosted_runners &&
      self_hosted_runners_os_not_allowed.length === 0
    ) {
      pass = true;
      data = {
        self_hosted_runners_in_policy: self_hosted_runners,
        self_hosted_runners_defined,
      };
    } else {
      data = {
        self_hosted_runners_in_policy: self_hosted_runners,
        self_hosted_runners_defined,
        self_hosted_runners_os_not_allowed,
      };
    }
    return { name, pass, data };
  }
}
