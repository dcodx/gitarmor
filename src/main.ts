import { parseInputs } from "./utils/Input";
import { getRepositoriesForOrg } from "./github/Organization";
import { logger } from "./utils/Logger";
import { RepoPolicyEvaluator } from "./evaluators/RepoPolicyEvaluator";
import { OrgPolicyEvaluator } from "./evaluators/OrgPolicyEvaluator";
import { Report } from "./reporting/Report";
import { RepoPolicy, OrgPolicy, Repository } from "./types/common/main";
import { loadPolicy } from "./utils/policies";
import * as core from "@actions/core";
import { summary } from "@actions/core/lib/summary";

const run = async (): Promise<void> => {
  try {
    const startTime = process.hrtime();
    const inputs = parseInputs();
    const policies: any = await loadPolicy(inputs);

    logger.debug("DEBUG MODE: " + inputs.debug);
    let report = new Report();
    report.addInput(inputs);
    report.addPolicy(policies);
    const policyEvaluator = null;
    // depending on which input.level is provided, run the appropriate checks
    if (inputs.level === "organization") {
      logger.info("Running org level checks");

      const organizationPolicyEvaluator = new OrgPolicyEvaluator(
        inputs.org,
        policies.org as OrgPolicy,
      );

      await organizationPolicyEvaluator.evaluatePolicy();
      organizationPolicyEvaluator.printCheckResults();
      report.addOrgEvaluator(organizationPolicyEvaluator);

      const repos = await getRepositoriesForOrg(inputs.org);
      logger.info("Total Repos: " + repos.length);
      await Promise.all(
        repos.map(async (repo) => {
          const repository: Repository = {
            name: repo.name,
            owner: inputs.org,
          };
          const repoPolicyEvaluator = new RepoPolicyEvaluator(
            repository,
            policies.repo as RepoPolicy,
          );
          await repoPolicyEvaluator.evaluatePolicy();
          repoPolicyEvaluator.printCheckResults();
          report.addRepoEvaluatorToOrg(
            organizationPolicyEvaluator,
            repoPolicyEvaluator,
          );
        }),
      );
    } else if (inputs.level === "repository") {
      const repository: Repository = {
        name: inputs.repo,
        owner: inputs.org,
      };
      logger.info("Running repo level checks");

      const policyEvaluator = new RepoPolicyEvaluator(
        repository,
        policies.repo as RepoPolicy,
      );

      await policyEvaluator.evaluatePolicy();
      policyEvaluator.printCheckResults();
      report.addOneRepoEvaluator(policyEvaluator);
    } else {
      // TODO: Implement enterprise level checks
      logger.info("Running enterprise level checks => Not implemented yet");
    }

    report.prepareReports();
    report.writeReportToFile();
    if (process.env.GITHUB_ACTIONS) {
      core.setOutput("check-results-json", report.getReportJson());
      core.setOutput("check-results-text", report.getReportText());
    }

    const endTime = process.hrtime(startTime);
    logger.debug(`Execution time: ${endTime[0]}s ${endTime[1] / 1000000}ms`);
  } catch (error) {
    if (process.env.GITHUB_ACTIONS) {
      core.setFailed(error);
    } else {
      logger.error(error);
    }
  }
};

run();
