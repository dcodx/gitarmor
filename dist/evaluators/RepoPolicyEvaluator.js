"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepoPolicyEvaluator = void 0;
const logger_1 = require("./../utils/logger");
const BranchProtectionChecks_1 = require("./repository/BranchProtectionChecks");
const GHASChecks_1 = require("./repository/GHASChecks");
const Repositories_1 = require("../github/Repositories");
const FilesExistChecks_1 = require("./multipurpose/FilesExistChecks");
const ActionsChecks_1 = require("./repository/ActionsChecks");
const WorkflowsChecks_1 = require("./repository/WorkflowsChecks");
const RunnersChecks_1 = require("./repository/RunnersChecks");
const WebHooksChecks_1 = require("./repository/WebHooksChecks");
const AdminsChecks_1 = require("./repository/AdminsChecks");
// This class is the main Repository evaluator. It evaluates the policy for a given repository.
class RepoPolicyEvaluator {
    policy; // The policy to be evaluated loaded later. This is always the repo policy
    repository; // The repository to be evaluated
    repositoryData; // The repository data from the API
    repositoryCheckResults; // The checks to be performed on the repository
    // Constructor takes a Repository object as input
    constructor(repository, policy) {
        this.policy = policy;
        this.repository = repository;
        this.repositoryData = null;
        this.repositoryCheckResults = [];
    }
    // This method evaluates the policy for the repository
    async evaluatePolicy() {
        // Get the repository data from the API
        this.repositoryData = await (0, Repositories_1.getRepository)(this.repository.owner, this.repository.name);
        logger_1.logger.debug("Repository policy for repo: " + this.repository.name);
        // Check the branch protection policy rule
        if (this.policy.protected_branches &&
            this.policy.protected_branches.length > 0) {
            const branch_protection = new BranchProtectionChecks_1.BranchProtectionChecks(this.policy, this.repository);
            const branch_protection_results = await branch_protection.checkBranchProtection();
            logger_1.logger.debug(`Branch protection rule results: ${JSON.stringify(branch_protection_results, null, 2)}`);
            this.repositoryCheckResults.push(branch_protection_results);
            // Check if require pull request before merging is enabled for the protected branches
            const branch_protection_pull_request_results = await branch_protection.checkRequirePullRequest();
            logger_1.logger.debug(`Branch protection pull requests rule results: ${JSON.stringify(branch_protection_pull_request_results, null, 2)}`);
            this.repositoryCheckResults.push(branch_protection_pull_request_results);
        }
        // Check the files exist policy rule
        if (this.policy.file_exists && this.policy.file_exists.length > 0) {
            const files_exist = await new FilesExistChecks_1.FilesExistChecks(this.repository, this.policy).checkFilesExist();
            logger_1.logger.debug(`Files exists results: ${JSON.stringify(files_exist)}`);
            this.repositoryCheckResults.push(files_exist);
        }
        //Run the GHAS checks
        if (this.policy.advanced_security) {
            const ghas_checks = await new GHASChecks_1.GHASChecks(this.policy, this.repository, this.repositoryData).evaluate();
            logger_1.logger.debug(`GHAS results: ${JSON.stringify(ghas_checks)}`);
            this.repositoryCheckResults.push(ghas_checks);
        }
        //Run Actions checks
        if (this.policy.actions) {
            const actions_checks = await new ActionsChecks_1.ActionsChecks(this.policy, this.repository).checkActionsPermissions();
            logger_1.logger.debug(`Action checks results: ${JSON.stringify(actions_checks)}`);
            this.repositoryCheckResults.push(actions_checks);
        }
        //Run workflow checks
        if (this.policy.workflows) {
            const workflow_checks = await new WorkflowsChecks_1.WorkflowsChecks(this.policy, this.repository).checkWorkflowsDefaultPermissions();
            logger_1.logger.debug(`Workflow checks results: ${JSON.stringify(workflow_checks)}`);
            //This check only applies to private and internal repositories
            const workflow_access_checks = await new WorkflowsChecks_1.WorkflowsChecks(this.policy, this.repository).checkWorkflowsAccessPermissions();
            logger_1.logger.debug(`Workflow access checks results: ${JSON.stringify(workflow_access_checks)}`);
        }
        //Run runner checks
        if (this.policy.runners) {
            const runner_checks = await new RunnersChecks_1.RunnersChecks(this.policy, this.repository).checkRunnersPermissions();
            logger_1.logger.debug(`Runner checks results: ${JSON.stringify(runner_checks)}`);
            this.repositoryCheckResults.push(runner_checks);
        }
        if (this.policy.webhooks) {
            const webhook_checks = await new WebHooksChecks_1.WebHooksChecks(this.policy, this.repository).checkWebHooks();
            logger_1.logger.debug(`Webhook checks results: ${JSON.stringify(webhook_checks)}`);
            this.repositoryCheckResults.push(webhook_checks);
        }
        if (this.policy.admins) {
            const admins_checks = await new AdminsChecks_1.AdminsChecks(this.policy, this.repository).checkAdmins();
            logger_1.logger.debug(`Admins checks results: ${JSON.stringify(admins_checks)}`);
            this.repositoryCheckResults.push(admins_checks);
        }
    }
    // Run webhook checks
    printCheckResults() {
        logger_1.logger.info("------------------------------------------------------------------------");
        logger_1.logger.info(`Repository policy results - ${this.getFullRepositoryName()}:`);
        logger_1.logger.info("------------------------------------------------------------------------");
        this.repositoryCheckResults.forEach((checkResult) => {
            const emoji = checkResult.pass === null ? "😐" : checkResult.pass ? "✅" : "❌";
            logger_1.logger.info(`[${emoji}] Check: ${checkResult.name} - Pass: ${checkResult.pass} \n${JSON.stringify(checkResult.data, null, 3)}`);
        });
    }
    getFullRepositoryName() {
        return `${this.repository.owner}/${this.repository.name}`;
    }
    getCheckResults() {
        return this.repositoryCheckResults;
    }
}
exports.RepoPolicyEvaluator = RepoPolicyEvaluator;
