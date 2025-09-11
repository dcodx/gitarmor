import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { logger } from "../utils/logger";
import { Policy, OrgPolicy, RepoPolicy, Inputs } from "../types/common/main";

export const loadPolicy = async (inputs: Inputs): Promise<Policy> => {
  let policy: Policy = {};
  try {
    logger.debug(`Loading policies from: ${inputs.policy_dir}`);
    if (inputs.level === "organization_only") {
      const orgPolicyFile = fs.readFileSync(
        path.join(inputs.policy_dir, "organization.yml"),
        "utf8",
      );
      policy.org = yaml.load(orgPolicyFile) as OrgPolicy;
    } else if (inputs.level === "repository_only") {
      const repoPolicyFile = fs.readFileSync(
        path.join(inputs.policy_dir, "repository.yml"),
        "utf8",
      );
      policy.repo = yaml.load(repoPolicyFile) as RepoPolicy;
    } else if (inputs.level === "organization_and_repository") {
      // Load organization policy
      const orgPolicyFile = fs.readFileSync(
        path.join(inputs.policy_dir, "organization.yml"),
        "utf8",
      );
      policy.org = yaml.load(orgPolicyFile) as OrgPolicy;
      // Load repository policy
      const repoPolicyFile = fs.readFileSync(
        path.join(inputs.policy_dir, "repository.yml"),
        "utf8",
      );
      policy.repo = yaml.load(repoPolicyFile) as RepoPolicy;
    }
  
    logger.debug("Policy:");
    logger.debug(yaml.dump(policy));
  } catch (error) {
    logger.error(
      "Error loading the policy file. Please check the logs: " + error,
    );
  }

  return policy;
};
