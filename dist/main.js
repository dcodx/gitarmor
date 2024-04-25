"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Input_1 = require("./utils/Input");
const Organization_1 = require("./github/Organization");
const Logger_1 = require("./utils/Logger");
const RepoPolicyEvaluator_1 = require("./evaluators/RepoPolicyEvaluator");
const OrgPolicyEvaluator_1 = require("./evaluators/OrgPolicyEvaluator");
const Report_1 = require("./reporting/Report");
const policies_1 = require("./utils/policies");
const core = __importStar(require("@actions/core"));
const run = async () => {
    try {
        const startTime = process.hrtime();
        const inputs = (0, Input_1.parseInputs)();
        const policies = await (0, policies_1.loadPolicy)(inputs);
        Logger_1.logger.debug("DEBUG MODE: " + inputs.debug);
        let report = new Report_1.Report();
        report.addInput(inputs);
        report.addPolicy(policies);
        const policyEvaluator = null;
        // depending on which input.level is provided, run the appropriate checks
        if (inputs.level === "organization") {
            Logger_1.logger.info("Running org level checks");
            const organizationPolicyEvaluator = new OrgPolicyEvaluator_1.OrgPolicyEvaluator(inputs.org, policies.org);
            await organizationPolicyEvaluator.evaluatePolicy();
            organizationPolicyEvaluator.printCheckResults();
            report.addOrgEvaluator(organizationPolicyEvaluator);
            const repos = await (0, Organization_1.getRepositoriesForOrg)(inputs.org);
            Logger_1.logger.info("Total Repos: " + repos.length);
            await Promise.all(repos.map(async (repo) => {
                const repository = {
                    name: repo.name,
                    owner: inputs.org,
                };
                const repoPolicyEvaluator = new RepoPolicyEvaluator_1.RepoPolicyEvaluator(repository, policies.repo);
                await repoPolicyEvaluator.evaluatePolicy();
                repoPolicyEvaluator.printCheckResults();
                report.addRepoEvaluatorToOrg(organizationPolicyEvaluator, repoPolicyEvaluator);
            }));
        }
        else if (inputs.level === "repository") {
            const repository = {
                name: inputs.repo,
                owner: inputs.org,
            };
            Logger_1.logger.info("Running repo level checks");
            const policyEvaluator = new RepoPolicyEvaluator_1.RepoPolicyEvaluator(repository, policies.repo);
            await policyEvaluator.evaluatePolicy();
            policyEvaluator.printCheckResults();
            report.addOneRepoEvaluator(policyEvaluator);
        }
        else {
            // TODO: Implement enterprise level checks
            Logger_1.logger.info("Running enterprise level checks => Not implemented yet");
        }
        report.prepareReports();
        report.writeReportToFile();
        if (process.env.GITHUB_ACTIONS) {
            core.setOutput("check-results-json", report.getReportJson());
            core.setOutput("check-results-text", report.getReportText());
        }
        const endTime = process.hrtime(startTime);
        Logger_1.logger.debug(`Execution time: ${endTime[0]}s ${endTime[1] / 1000000}ms`);
    }
    catch (error) {
        if (process.env.GITHUB_ACTIONS) {
            core.setFailed(error);
        }
        else {
            console.log(error.status);
            Logger_1.logger.error(error.message);
        }
    }
};
run();
