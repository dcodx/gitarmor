"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepoWorkflowActions = exports.getRepoWorkflows = exports.getRepoWorkflowAccessPermissions = exports.getRepoDefaultWorkflowsPermissions = exports.getRepoSelectedActions = exports.getRepoActionsPermissions = void 0;
const GitArmorKit_1 = require("./GitArmorKit");
const logger_1 = require("../utils/logger");
//Get GitHub Actions permissions for a repository
const getRepoActionsPermissions = async (owner, repo) => {
    try {
        const octokit = new GitArmorKit_1.GitArmorKit();
        const response = await octokit.rest.actions.getGithubActionsPermissionsRepository({
            owner: owner,
            repo: repo,
        });
        return response.data;
    }
    catch (error) {
        logger_1.logger.error(error.message);
        throw error;
    }
};
exports.getRepoActionsPermissions = getRepoActionsPermissions;
// Get allowed actions and reusable workflows for a repository
const getRepoSelectedActions = async (owner, repo) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    const response = await octokit.request("GET /repos/{owner}/{repo}/actions/permissions/selected-actions", {
        owner: owner,
        repo: repo,
    });
    return response.data;
};
exports.getRepoSelectedActions = getRepoSelectedActions;
// Get default workflow permissions for a repository
const getRepoDefaultWorkflowsPermissions = async (owner, repo) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    const response = await octokit.rest.actions.getGithubActionsDefaultWorkflowPermissionsRepository({
        owner: owner,
        repo: repo,
    });
    return response.data;
};
exports.getRepoDefaultWorkflowsPermissions = getRepoDefaultWorkflowsPermissions;
// Get the level of access for workflows outside of the repository using GET /repos/{owner}/{repo}/actions/permissions/access
const getRepoWorkflowAccessPermissions = async (owner, repo) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    const response = await octokit.request("GET /repos/{owner}/{repo}/actions/permissions/access", {
        owner: owner,
        repo: repo,
    });
    return response.data;
};
exports.getRepoWorkflowAccessPermissions = getRepoWorkflowAccessPermissions;
//Get all the actions used in the workflows declared in a repository and retursn the list of actions.
const getRepoWorkflows = async (owner, repo) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    const response = await octokit.rest.actions.listRepoWorkflows({
        owner: owner,
        repo: repo,
    });
    return response.data;
};
exports.getRepoWorkflows = getRepoWorkflows;
//using getRepoFile get the content of a workflow file and parse it to get the list of actions used in the workflow
//and return the list of actions used in the workflow
const getRepoWorkflowActions = async (owner, repo, path) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    const response = await octokit.rest.repos.getContent({
        owner: owner,
        repo: repo,
        path: path,
    });
    if ("content" in response.data) {
        const content = Buffer.from(response.data.content, "base64").toString("ascii");
        const actions = content.match(/uses: (.*)/g);
        return actions;
    }
    else {
        throw new Error("The specified path does not point to a file.");
    }
};
exports.getRepoWorkflowActions = getRepoWorkflowActions;
