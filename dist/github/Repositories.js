"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepositoryCodeScanningAnalysis = exports.getRepoDependabotSecurityUpdates = exports.getRepoDependabotAlerts = exports.getRepoFile = exports.getRepoBranchProtection = exports.getRepoProtectedBranches = exports.getRepoBranch = exports.getRepoCollaborators = exports.getRepoPullRequests = exports.getRepository = exports.getRepositoriesForTeamAsAdmin = void 0;
const GitArmorKit_1 = require("./GitArmorKit");
const Logger_1 = require("../utils/Logger");
const getRepositoriesForTeamAsAdmin = async (org, teamSlug) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    try {
        //get team id from slug
        const team = await octokit.rest.teams.getByName({
            org: org,
            team_slug: teamSlug,
        });
        const repos = await octokit.paginate(`GET /teams/${team.data.id}/repos`, {
            per_page: 100,
        });
        return repos.filter((repo) => repo.permissions?.admin);
    }
    catch (error) {
        Logger_1.logger.error(error.message);
        throw error;
    }
};
exports.getRepositoriesForTeamAsAdmin = getRepositoriesForTeamAsAdmin;
const getRepository = async (owner, repo) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    try {
        const response = await octokit.rest.repos.get({
            owner: owner,
            repo: repo,
        });
        return response.data;
    }
    catch (error) {
        Logger_1.logger.error(error.message);
        throw error;
    }
};
exports.getRepository = getRepository;
const getRepoPullRequests = async (owner, repo) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    try {
        const response = await octokit.rest.pulls.list({
            owner: owner,
            repo: repo,
        });
        return response.data;
    }
    catch (error) {
        Logger_1.logger.error(error.message);
        throw error;
    }
};
exports.getRepoPullRequests = getRepoPullRequests;
const getRepoCollaborators = async (owner, repo) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    try {
        const response = await octokit.rest.repos.listCollaborators({
            owner: owner,
            repo: repo,
        });
        return response.data;
    }
    catch (error) {
        Logger_1.logger.error(error.message);
        throw error;
    }
};
exports.getRepoCollaborators = getRepoCollaborators;
// get  information for a specific branch in a repo
const getRepoBranch = async (owner, repo, branch) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    try {
        const response = await octokit.rest.repos.getBranch({
            owner: owner,
            repo: repo,
            branch: branch,
        });
        return response.data;
    }
    catch (error) {
        Logger_1.logger.error(error.message);
        throw error;
    }
};
exports.getRepoBranch = getRepoBranch;
// get all the branches for a repo and return only the protected branches
const getRepoProtectedBranches = async (owner, repo) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    try {
        const response = await octokit.rest.repos.listBranches({
            owner: owner,
            repo: repo,
            protected: true,
        });
        return response.data;
    }
    catch (error) {
        Logger_1.logger.error(error.message);
        throw error;
    }
};
exports.getRepoProtectedBranches = getRepoProtectedBranches;
// check if a protected branch requires a pull request before merging
const getRepoBranchProtection = async (owner, repo, branch) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    try {
        const response = await octokit.rest.repos.getBranchProtection({
            owner: owner,
            repo: repo,
            branch: branch,
        });
        return response.data;
    }
    catch (error) {
        Logger_1.logger.error(error.message);
        throw error;
    }
};
exports.getRepoBranchProtection = getRepoBranchProtection;
//verify the presence of a file in the repository
const getRepoFile = async (owner, repo, path) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    try {
        const response = await octokit.rest.repos.getContent({
            owner: owner,
            repo: repo,
            path: path,
        });
        return response.data;
    }
    catch (error) {
        Logger_1.logger.error(error.message);
        throw error;
    }
};
exports.getRepoFile = getRepoFile;
// get dependabot alerts status for a repo
const getRepoDependabotAlerts = async (owner, repo) => {
    try {
        const octokit = new GitArmorKit_1.GitArmorKit();
        const response = await octokit.rest.repos.checkVulnerabilityAlerts({
            owner: owner,
            repo: repo,
        });
        return response.status === 204 ? true : false;
    }
    catch (error) {
        if (error.status === 404) {
            return false;
        }
        else {
            Logger_1.logger.error(error.message);
            throw error;
        }
    }
};
exports.getRepoDependabotAlerts = getRepoDependabotAlerts;
// get dependabot security updates status for a repo
const getRepoDependabotSecurityUpdates = async (owner, repo) => {
    try {
        const octokit = new GitArmorKit_1.GitArmorKit();
        const response = await octokit.rest.repos.checkAutomatedSecurityFixes({
            owner: owner,
            repo: repo,
        });
        return response.status === 200 ? true : false;
    }
    catch (error) {
        if (error.status === 404) {
            return false;
        }
        else {
            Logger_1.logger.error(error.message);
            throw error;
        }
    }
};
exports.getRepoDependabotSecurityUpdates = getRepoDependabotSecurityUpdates;
// get CodeScanning analysis for a repo
const getRepositoryCodeScanningAnalysis = async (owner, repo) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    try {
        const response = await octokit.rest.codeScanning.listRecentAnalyses({
            owner: owner,
            repo: repo,
        });
        return response.data;
    }
    catch (error) {
        Logger_1.logger.debug(`Code scanning analysis fetching error: ${error.message}`);
        if ((error.status === 403 &&
            error.message.includes("Code scanning is not enabled for this repository")) ||
            error.message.includes("Advanced Security must be enabled for this repository to use code scanning.") ||
            error.message.includes("no analysis found")) {
            return [];
        }
        else {
            Logger_1.logger.error(error.message);
            throw error;
        }
    }
};
exports.getRepositoryCodeScanningAnalysis = getRepositoryCodeScanningAnalysis;
