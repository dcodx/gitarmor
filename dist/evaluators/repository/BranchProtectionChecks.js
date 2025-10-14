"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchProtectionChecks = void 0;
const Repositories_1 = require("../../github/Repositories");
const logger_1 = require("../../utils/logger");
class BranchProtectionChecks {
    policy;
    repository;
    protectedBranches;
    constructor(policy, repository) {
        this.policy = policy;
        this.repository = repository;
        this.protectedBranches = this.getRepoProtectedBranches(this.repository.owner, this.repository.name);
    }
    async getRepoProtectedBranches(owner, repo) {
        // Implementation of getRepoProtectedBranches using getRepoProtectedBranches method
        // from github/Repositories.ts
        // this is needed as the constructor cannot be async
        const protectedBranches = await (0, Repositories_1.getRepoProtectedBranches)(owner, repo);
        return protectedBranches;
    }
    async checkBranchProtection() {
        const protectedBranchNames = await this.getProtectedBranchNames();
        const policyBranches = this.policy.protected_branches;
        const nonProtectedBranches = [];
        const nonExistentBranches = [];
        for (const branch of policyBranches) {
            if (!protectedBranchNames.includes(branch.name)) {
                const branchExists = await this.doesBranchExist(branch.name);
                if (branchExists) {
                    nonProtectedBranches.push(branch.name);
                }
                else {
                    nonExistentBranches.push(branch.name);
                }
            }
        }
        return this.createResult(nonProtectedBranches, nonExistentBranches, protectedBranchNames);
    }
    async getProtectedBranchNames() {
        const protectedBranches = await this.protectedBranches;
        return protectedBranches.map((branch) => branch.name);
    }
    async doesBranchExist(branchName) {
        try {
            await (0, Repositories_1.getRepoBranch)(this.repository.owner, this.repository.name, branchName);
            return true;
        }
        catch (error) {
            if (error.status === 404) {
                return false;
            }
            else {
                throw error;
            }
        }
    }
    createResult(nonProtectedBranches, nonExistentBranches, protectedBranchNames) {
        const name = "Branch Protection";
        // Policy branches declared in the policy
        const policyBranchNames = (this.policy?.protected_branches || [])
            .map((b) => b?.name)
            .filter((n) => !!n);
        // Passed = policy branches that are protected in the repo
        const passed = protectedBranchNames.filter((n) => policyBranchNames.includes(n));
        // Failed buckets per requirement
        const failed = {
            not_protected: nonProtectedBranches,
            non_existent: nonExistentBranches,
        };
        // Info = protected branches in repo that are NOT declared in policy
        const extraProtected = protectedBranchNames.filter((n) => !policyBranchNames.includes(n));
        const info = {
            extra_protected_branches: extraProtected,
        };
        const pass = failed.not_protected.length === 0 && failed.non_existent.length === 0;
        const data = {
            passed,
            failed,
            info,
        };
        return { name, pass, data };
    }
    createResultRequirePullRequest(results) {
        const name = "Branch Protection - Pull Request Settings";
        // Determine branches that passed all PR settings
        const passed = Object.entries(results)
            .filter(([_, branchResults]) => {
            if (!branchResults || branchResults.error)
                return false;
            // Consider only top-level booleans as in previous implementation
            return Object.values(branchResults).every((value) => !!value);
        })
            .map(([branch]) => branch);
        // Collect rules failures for protected branches that didn't pass
        const rules_not_satisfied = {};
        Object.entries(results).forEach(([branch, branchResults]) => {
            if (!branchResults || branchResults.error)
                return;
            const branchPass = Object.values(branchResults).every((value) => !!value);
            if (!branchPass) {
                rules_not_satisfied[branch] = branchResults;
            }
        });
        // Failed should be a direct map of branch -> failed details (no wrapper)
        const failed = rules_not_satisfied;
        const pass = Object.keys(failed).length === 0;
        // Info: branches that are protected but have no PR rules configured
        const no_pr_rules = Object.entries(results)
            .filter(([_, branchResults]) => !!branchResults?.error)
            .map(([branch]) => branch);
        const info = {};
        if (no_pr_rules.length > 0)
            info.no_pr_rules = no_pr_rules;
        const data = { passed, failed, info };
        return { name, pass, data };
    }
    getProtectedBranchesToCheck(branchesToCheck, protectedBranches) {
        const branchesAvailable = branchesToCheck.filter((branch) => protectedBranches.map((branch) => branch.name).includes(branch));
        logger_1.logger.debug("Only these branches will be checked against branch protection rules: " +
            branchesAvailable);
        return branchesAvailable;
    }
    // check if require pull request before merging is enabled for the protected branches using getRepoBranchProtection method from github/Repositories.ts
    async checkRequirePullRequest() {
        const protectedBranches = await this.protectedBranches;
        const policyBranches = this.policy.protected_branches;
        const branchesToCheckFor = policyBranches
            .filter((branch) => Object.keys(branch).length > 1)
            .map((branch) => branch.name);
        const branchesToCheckInRepo = this.getProtectedBranchesToCheck(branchesToCheckFor, protectedBranches);
        const results = {};
        await Promise.all(branchesToCheckInRepo.map(async (branch) => {
            try {
                const branchProtection = await (0, Repositories_1.getRepoBranchProtection)(this.repository.owner, this.repository.name, branch);
                const policyBranch = policyBranches.find((policyBranch) => policyBranch.name === branch);
                const branchResults = this.checkPolicyBranchProtectionPullRequestSettings(policyBranch, branchProtection, branch);
                const branchProtectionResults = this.checkPolicyBranchProtectionSettings(policyBranch, branchProtection, branch);
                const branchRequiredStatusChecks = this.checkRequiredStatusChecks(policyBranch, branchProtection, branch);
                results[branch] = {
                    ...branchResults[branch],
                    ...branchProtectionResults[branch],
                    ...branchRequiredStatusChecks[branch],
                };
            }
            catch (error) {
                // If the branch is protected but no rules are set.
                logger_1.logger.debug(`Exception: ${error}`);
                results[branch] = {
                    error: "No branch protection rules set for this branch",
                };
            }
        }));
        return this.createResultRequirePullRequest(results);
    }
    checkPolicyBranchProtectionPullRequestSettings(policyBranch, branchProtection, branch) {
        let results = {};
        results[branch] = {};
        const policyBranchReviews = policyBranch.required_pull_request_reviews;
        const branchProtectionReviews = branchProtection.required_pull_request_reviews;
        if (!branchProtectionReviews) {
            results[branch].required_pull_request_reviews = false;
            return results;
        }
        if (!policyBranchReviews)
            return results;
        if (typeof policyBranchReviews === "boolean") {
            results[branch].required_pull_request_reviews = !!branchProtectionReviews;
            return results;
        }
        results[branch].required_pull_request_reviews = true;
        Object.keys(policyBranchReviews).forEach((key) => {
            if (!branchProtectionReviews || !(key in branchProtectionReviews))
                return;
            if (key === "dismissal_restrictions") {
                ["users", "teams", "apps"].forEach((type) => {
                    if (policyBranchReviews[key][type]) {
                        const branchProtectionEntities = branchProtectionReviews[key][type].map((entity) => entity.login || entity.slug);
                        const missingEntities = policyBranchReviews[key][type].filter((entity) => !branchProtectionEntities.includes(entity));
                        results[branch][`${key}_${type}`] = {
                            [type]: missingEntities.length === 0,
                            [`missing_${type}`]: missingEntities,
                        };
                    }
                });
                return;
            }
            results[branch][key] =
                branchProtectionReviews[key] === policyBranchReviews[key];
        });
        return results;
    }
    // this function gets in input the policy branch and the branch protection object and the branch. It checks for
    /*
        required_signatures: true
        enforce_admins: true
        required_linear_history: true
        allow_force_pushes: false
        allow_deletions: false
        block_creations: false
        required_conversation_resolution: false
        lock_branch: false
        allow_fork_syncing: false
     */
    // and returns an object with the results of the checks
    checkPolicyBranchProtectionSettings(policyBranch, branchProtection, branch) {
        let results = {};
        const specificKeys = [
            "required_signatures",
            "enforce_admins",
            "required_linear_history",
            "allow_force_pushes",
            "allow_deletions",
            "block_creations",
            "required_conversation_resolution",
            "lock_branch",
            "allow_fork_syncing",
        ];
        const policyBranchKeys = Object.keys(policyBranch);
        const branchProtectionKeys = Object.keys(branchProtection);
        const branchProtectionChecks = policyBranchKeys
            .filter((key) => specificKeys.includes(key) && branchProtectionKeys.includes(key))
            .map((key) => {
            if (branchProtection[key].enabled === policyBranch[key]) {
                return { [key]: true };
            }
            else {
                return { [key]: false };
            }
        });
        results[branch] = branchProtectionChecks.reduce((acc, curr) => ({ ...acc, ...curr }), {}); // flatten the array to remove the main array and have only the objects
        return results;
    }
    checkRequiredStatusChecks(policyBranch, branchProtection, branch) {
        const results = {};
        const policyBranchRequiredStatusChecks = policyBranch.required_status_checks;
        const branchProtectionRequiredStatusChecks = branchProtection.required_status_checks;
        if (!policyBranchRequiredStatusChecks)
            return results;
        if (!branchProtectionRequiredStatusChecks) {
            results[branch] = { required_status_checks: false };
            return results;
        }
        results[branch] = { required_status_checks: {} };
        for (const key in policyBranchRequiredStatusChecks) {
            if (key === "contexts") {
                const missingContexts = policyBranchRequiredStatusChecks[key].filter((context) => !branchProtectionRequiredStatusChecks[key].includes(context));
                results[branch].required_status_checks[key] = {
                    [key]: missingContexts.length === 0,
                    [`missing_${key}`]: missingContexts,
                };
            }
            else if (key === "strict") {
                results[branch].required_status_checks[key] =
                    branchProtectionRequiredStatusChecks[key] ===
                        policyBranchRequiredStatusChecks[key];
            }
        }
        return results;
    }
}
exports.BranchProtectionChecks = BranchProtectionChecks;
