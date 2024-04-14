import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { logger } from "./Logger";
import { Policy, OrgPolicy, RepoPolicy, Inputs } from "../types/common/main";

export const loadPolicy = async (inputs: Inputs): Promise<Policy> => {
  let policy: Policy = {};
  try {
    logger.debug(`Loading policies from: ${inputs.policy_dir}`);
    if (inputs.level === "organization") {
      const orgPolicyFile = fs.readFileSync(
        path.join(inputs.policy_dir, "organization.yml"),
        "utf8",
      );
      policy.org = yaml.load(orgPolicyFile) as OrgPolicy;

      const repoPolicyFile = fs.readFileSync(
        path.join(inputs.policy_dir, "repository.yml"),
        "utf8",
      );
      policy.repo = yaml.load(repoPolicyFile) as RepoPolicy;
    } else if (inputs.level === "repository") {
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
