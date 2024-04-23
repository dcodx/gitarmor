"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepoRunners = void 0;
const GitArmorKit_1 = require("./GitArmorKit");
const Logger_1 = require("../utils/Logger");
//List self-hosted runners for a repository
const getRepoRunners = async (owner, repo) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    try {
        const response = await octokit.rest.actions.listSelfHostedRunnersForRepo({
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
exports.getRepoRunners = getRepoRunners;
