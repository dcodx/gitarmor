"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepoRunners = void 0;
const GitArmorKit_1 = require("./GitArmorKit");
//List self-hosted runners for a repository
const getRepoRunners = async (owner, repo) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    const response = await octokit.rest.actions.listSelfHostedRunnersForRepo({
        owner: owner,
        repo: repo,
    });
    return response.data;
};
exports.getRepoRunners = getRepoRunners;
