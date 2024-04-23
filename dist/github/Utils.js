"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepoFile = void 0;
const GitArmorKit_1 = require("./GitArmorKit");
const Logger_1 = require("../utils/Logger");
//Given a certain path in a repository, get the contents of the file
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
