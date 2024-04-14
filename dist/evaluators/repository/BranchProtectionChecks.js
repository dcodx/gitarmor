"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchProtectionChecks = void 0;
const Repositories_1 = require("../../github/Repositories");
const Logger_1 = require("../../utils/Logger");
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
        let name = "Branch Protection";
        let pass = false;
        let data = {};
        if (nonProtectedBranches.length === 0 && nonExistentBranches.length === 0) {
            pass = true;
            data = { allBranchesProtected: true, protectedBranchNames };
        }
        else {
            data = {
                nonProtectedBranches,
                nonExistentBranches,
                protectedBranchNames,
            };
        }
        return { name, pass, data };
    }
    createResultRequirePullRequest(results) {
        let name = "Branch Protection - Pull Request Settings";
        let pass = true;
        let data = results;
        if (Object.keys(data).length === 0 && data.constructor === Object) {
            // data is an empty object, so there are no branch protection rules defined
            pass = false;
        }
        //for each branch, check if all the rules are satisfied
        for (const branch in data) {
            if (data[branch].error) {
                pass = false;
                break;
            }
            const branchResults = data[branch];
            const branchPass = Object.values(branchResults).every((value) => value);
            if (!branchPass) {
                pass = false;
                break;
            }
        }
        return { name, pass, data };
    }
    getProtectedBranchesToCheck(branchesToCheck, protectedBranches) {
        const branchesAvailable = branchesToCheck.filter((branch) => protectedBranches.map((branch) => branch.name).includes(branch));
        Logger_1.logger.debug("Only these branches will be checked against branch protection rules: " +
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
                Logger_1.logger.debug(`Exception: ${error}`);
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
