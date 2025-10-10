import { Inputs } from "../types/common/main";
import { getInput } from "@actions/core";
import { logger } from "./logger";

export const parseInputs = (): Inputs => {
  // read inputs from .env file or action inputs
  const inputs: Inputs = {
    repo: getInput("repo") || process.env.REPO,
    org: getInput("org") || process.env.ORG,
    token: getInput("token") || process.env.TOKEN,
    level: getInput("level") || process.env.LEVEL,
    policy_dir: getInput("policy-dir") || process.env.POLICY_DIR,
    debug: getInput("debug") || process.env.DEBUG,
  };

  // validate inputs
  if (
    !(inputs.repo || inputs.org) ||
    !inputs.token ||
    !inputs.level ||
    !inputs.policy_dir
  ) {
    throw new Error(
      "You must provide required inputs. Current inputs: " +
        JSON.stringify(inputs),
    );
  }

  logger.debug("Inputs: " + JSON.stringify(inputs));
  return inputs;
};
