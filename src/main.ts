import { parseInputs } from "./utils/input";
import { getRepositoriesForOrg } from "./github/Organization";
import { logger } from "./utils/logger";
import { RepoPolicyEvaluator } from "./evaluators/RepoPolicyEvaluator";
import { OrgPolicyEvaluator } from "./evaluators/OrgPolicyEvaluator";
import { Report } from "./reporting/Report";
import { RepoPolicy, OrgPolicy, Repository } from "./types/common/main";
import { loadPolicy } from "./utils/policies";
import * as core from "@actions/core";

const run = async (): Promise<void> => {
  logger.info(`

             GitArmor                                                                                       
     by dcodx.com - version 1.0
              
    `);

  // Adjusted part of the run function
  try {
    const startTime = process.hrtime();
    const inputs = parseInputs();

    const policies: any = await loadPolicy(inputs);
    logger.debug("DEBUG MODE: " + inputs.debug);
    let report = new Report();
    report.addInput(inputs);
    report.addPolicy(policies);
  
    if (inputs.level === "organization_only") {
      logger.info("Running organization level checks only");
      const organizationPolicyEvaluator = new OrgPolicyEvaluator(inputs.org, policies.org as OrgPolicy);
      await organizationPolicyEvaluator.evaluatePolicy();
      organizationPolicyEvaluator.printCheckResults();
      report.addOrgEvaluator(organizationPolicyEvaluator);
    } else if (inputs.level === "repository_only") {
      logger.info("Running repository level checks only");
      const repository: Repository = {
        name: inputs.repo,
        owner: inputs.org,
      };
      const repoPolicyEvaluator = new RepoPolicyEvaluator(repository, policies.repo as RepoPolicy);
      await repoPolicyEvaluator.evaluatePolicy();
      repoPolicyEvaluator.printCheckResults();
      report.addOneRepoEvaluator(repoPolicyEvaluator);
    } else if (inputs.level === "organization_and_repository") {
      logger.info("Running both organization and repository level checks");
      logger.warn("⚠️ Running the tool with 'organization_and_repository' level might trigger the GitHub API rate limit. Please use it with caution.");

      // Organization checks
      const organizationPolicyEvaluator = new OrgPolicyEvaluator(inputs.org, policies.org as OrgPolicy);
      await organizationPolicyEvaluator.evaluatePolicy();
      organizationPolicyEvaluator.printCheckResults();
      report.addOrgEvaluator(organizationPolicyEvaluator);
      // Repository checks within the organization
      const repos = await getRepositoriesForOrg(inputs.org);
      logger.info("Total Repos: " + repos.length);
      await Promise.all(repos.map(async (repo) => {
        const repository: Repository = {
          name: repo.name,
          owner: inputs.org,
        };
        const repoPolicyEvaluator = new RepoPolicyEvaluator(repository, policies.repo as RepoPolicy);
        await repoPolicyEvaluator.evaluatePolicy();
        repoPolicyEvaluator.printCheckResults();
        report.addRepoEvaluatorToOrg(organizationPolicyEvaluator, repoPolicyEvaluator);
      }));
    } else {
      logger.info("Invalid level specified");
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
      logger.error(error.message);
    }
  }
};

run();
