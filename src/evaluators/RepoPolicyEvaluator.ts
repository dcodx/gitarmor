import { logger } from "./../utils/Logger";
import { RepoPolicy, Repository, CheckResult } from "../types/common/main";
import { BranchProtectionChecks } from "./repository/BranchProtectionChecks";
import { GHASChecks } from "./repository/GHASChecks";
import { getRepository } from "../github/Repositories";
import { FilesExistChecks } from "./multipurpose/FilesExistChecks";
import { ActionsChecks } from "./repository/ActionsChecks";
import { WorkflowsChecks } from "./repository/WorkflowsChecks";
import { RunnersChecks } from "./repository/RunnersChecks";
import { WebHooksChecks } from "./repository/WebHooksChecks";

// This class is the main Repository evaluator. It evaluates the policy for a given repository.
export class RepoPolicyEvaluator {
  public policy: RepoPolicy; // The policy to be evaluated loaded later. This is always the repo policy
  private repository: Repository; // The repository to be evaluated
  private repositoryData: any; // The repository data from the API
  public repositoryCheckResults: CheckResult[]; // The checks to be performed on the repository

  // Constructor takes a Repository object as input
  constructor(repository: Repository, policy: any) {
    this.policy = policy;
    this.repository = repository;
    this.repositoryData = null;
    this.repositoryCheckResults = [];
  }

  // This method evaluates the policy for the repository
  async evaluatePolicy() {
    // Get the repository data from the API
    this.repositoryData = await getRepository(
      this.repository.owner,
      this.repository.name,
    );

    logger.debug("Repository policy for repo: " + this.repository.name);
    // Check the branch protection policy rule
    if (this.policy.protected_branches.length > 0) {
      const branch_protection = new BranchProtectionChecks(
        this.policy,
        this.repository,
      );
      const branch_protection_results =
        await branch_protection.checkBranchProtection();
      logger.debug(
        `Branch protection rule results: ${JSON.stringify(
          branch_protection_results,
          null,
          2,
        )}`,
      );
      this.repositoryCheckResults.push(branch_protection_results);

      // Check if require pull request before merging is enabled for the protected branches
      const branch_protection_pull_request_results =
        await branch_protection.checkRequirePullRequest();
      logger.debug(
        `Branch protection pull requests rule results: ${JSON.stringify(
          branch_protection_pull_request_results,
          null,
          2,
        )}`,
      );
      this.repositoryCheckResults.push(branch_protection_pull_request_results);
    }

    // Check the files exist policy rule
    if (this.policy.file_exists.length > 0) {
      const files_exist = await new FilesExistChecks(
        this.repository,
        this.policy,
      ).checkFilesExist();
      logger.debug(`Files exists results: ${JSON.stringify(files_exist)}`);
      this.repositoryCheckResults.push(files_exist);
    }

    //Run the GHAS checks
    if (this.policy.advanced_security) {
      const ghas_checks = await new GHASChecks(
        this.policy,
        this.repository,
        this.repositoryData,
      ).evaluate();
      logger.debug(`GHAS results: ${JSON.stringify(ghas_checks)}`);
      this.repositoryCheckResults.push(ghas_checks);
    }

    //Run Actions checks
    if (this.policy.allowed_actions) {
      const actions_checks = await new ActionsChecks(
        this.policy,
        this.repository,
      ).checkActionsPermissions();
      logger.debug(`Action checks results: ${JSON.stringify(actions_checks)}`);
      this.repositoryCheckResults.push(actions_checks);
    }

    //Run workflow checks
    if (this.policy.workflows) {
      const workflow_checks = await new WorkflowsChecks(
        this.policy,
        this.repository,
      ).checkWorkflowsDefaultPermissions();
      logger.debug(
        `Workflow checks results: ${JSON.stringify(workflow_checks)}`,
      );

      //This check only applies to private and internal repositories
      const workflow_access_checks = await new WorkflowsChecks(
        this.policy,
        this.repository,
      ).checkWorkflowsAccessPermissions();
      logger.debug(
        `Workflow access checks results: ${JSON.stringify(workflow_access_checks)}`,
      );
    }
    //Run runner checks
    if (this.policy.runners) {
      const runner_checks = await new RunnersChecks(
        this.policy,
        this.repository,
      ).checkRunnersPermissions();
      logger.debug(`Runner checks results: ${JSON.stringify(runner_checks)}`);
      this.repositoryCheckResults.push(runner_checks);
    }

    if (this.policy.webhooks) {
      const webhook_checks = await new WebHooksChecks(
        this.policy,
        this.repository,
      ).checkWebHooks();
      logger.debug(`Webhook checks results: ${JSON.stringify(webhook_checks)}`);
      this.repositoryCheckResults.push(webhook_checks);
    }
  }

  // Run webhook checks

  public printCheckResults() {
    logger.info(
      "------------------------------------------------------------------------",
    );
    logger.info(`Repository policy results - ${this.getFullRepositoryName()}:`);
    logger.info(
      "------------------------------------------------------------------------",
    );
    this.repositoryCheckResults.forEach((checkResult) => {
      const emoji =
        checkResult.pass === null ? "😐" : checkResult.pass ? "✅" : "❌";
      logger.info(
        `[${emoji}] Check: ${checkResult.name} - Pass: ${checkResult.pass} \n${JSON.stringify(checkResult.data, null, 3)}`,
      );
    });
  }

  public getFullRepositoryName() {
    return `${this.repository.owner}/${this.repository.name}`;
  }

  public getCheckResults() {
    return this.repositoryCheckResults;
  }
}
