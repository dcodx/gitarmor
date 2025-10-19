import { getRepoRulesets } from "../../github/Repositories";
import { Repository, CheckResult } from "../../types/common/main";
import { logger } from "../../utils/logger";

export class TagProtectionChecks {
  private policy: any;
  private repository: Repository;

  constructor(policy: any, repository: Repository) {
    this.policy = policy;
    this.repository = repository;
  }

  async checkTagProtection(): Promise<CheckResult> {
    const rulesets = await getRepoRulesets(
      this.repository.owner,
      this.repository.name,
    );

    // Filter to get only tag rulesets that are active
    const tagRulesets = rulesets.filter(
      (ruleset: any) =>
        ruleset.target === "tag" && ruleset.enforcement === "active",
    );

    const policyTags = this.policy.protected_tags || [];
    const protectedTagPatterns = tagRulesets
      .map((ruleset: any) => {
        // Extract tag patterns from conditions
        if (ruleset.conditions?.ref_name?.include) {
          return ruleset.conditions.ref_name.include;
        }
        return [];
      })
      .flat();

    // Check which policy tags are protected
    const passedTags: string[] = [];
    const failedTags: string[] = [];

    for (const policyTag of policyTags) {
      const isProtected = this.isTagProtected(
        policyTag.name,
        protectedTagPatterns,
      );
      if (isProtected) {
        passedTags.push(policyTag.name);
      } else {
        failedTags.push(policyTag.name);
      }
    }

    return this.createResult(passedTags, failedTags, protectedTagPatterns);
  }

  private isTagProtected(
    tagName: string,
    protectedPatterns: string[],
  ): boolean {
    // Check if tag name matches any protected pattern
    for (const pattern of protectedPatterns) {
      if (pattern === "~ALL") {
        return true;
      }
      // Convert GitHub pattern to regex
      const regexPattern = pattern
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]");
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(tagName)) {
        return true;
      }
    }
    return false;
  }

  private createResult(
    passed: string[],
    failed: string[],
    protectedPatterns: string[],
  ): CheckResult {
    const name = "Tag Protection";
    const pass = failed.length === 0;

    const data = {
      passed,
      failed: {
        not_protected: failed,
      },
      info: {
        protected_patterns: protectedPatterns,
      },
    };

    return { name, pass, data };
  }
}
