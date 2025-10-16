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

    const policy = this.policy.runners || {};
    const passed: string[] = [];
    const failed: Record<string, any> = {};
    const info: Record<string, any> = { runners_defined: runners.total_count };

    // self_hosted_allowed: if false in policy, there must be zero runners
    if (typeof policy.self_hosted_allowed === "boolean") {
      if (policy.self_hosted_allowed === false) {
        if (runners.total_count === 0) {
          passed.push("self_hosted_allowed");
        } else {
          failed.self_hosted_allowed = false;
        }
      } else {
        // Policy allows self-hosted; presence is fine
        passed.push("self_hosted_allowed");
      }
    }

    // self_hosted_allowed_os: if provided, ensure all runner OS are whitelisted
    const allowedOs: string[] | undefined = policy.self_hosted_allowed_os;
    if (Array.isArray(allowedOs)) {
      const osViolations = (runners.runners || [])
        .filter((r: any) => !allowedOs.includes(r.os))
        .map((r: any) => ({ id: r.id, name: r.name, os: r.os }));
      if (osViolations.length === 0) {
        passed.push("self_hosted_allowed_os");
      } else {
        failed.self_hosted_allowed_os = osViolations;
      }
    }

    // self_hosted_allowed_labels: if provided, ensure each runner's labels are subset of allowed
    const allowedLabels: string[] | undefined =
      policy.self_hosted_allowed_labels;
    if (Array.isArray(allowedLabels)) {
      const labelViolations = (runners.runners || [])
        .map((r: any) => {
          const runnerLabels: string[] = (r.labels || []).map(
            (l: any) => l.name || l,
          );
          const disallowed = runnerLabels.filter(
            (lbl: string) => !allowedLabels.includes(lbl),
          );
          return disallowed.length > 0
            ? {
                id: r.id,
                name: r.name,
                os: r.os,
                disallowed_labels: disallowed,
              }
            : null;
        })
        .filter((v: any) => v !== null);
      if (labelViolations.length === 0) {
        passed.push("self_hosted_allowed_labels");
      } else {
        failed.self_hosted_allowed_labels = labelViolations;
      }
    }

    return this.createResult(passed, failed, info);
  }

  private createResult(
    passed: string[],
    failed: Record<string, any>,
    info: Record<string, any>,
  ): CheckResult {
    const name = "Runners Check";
    const pass = Object.keys(failed).length === 0;
    const data = { passed, failed, info };
    return { name, pass, data };
  }
}
