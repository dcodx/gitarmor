"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepoFile = void 0;
const GitArmorKit_1 = require("./GitArmorKit");
//Given a certain path in a repository, get the contents of the file
const getRepoFile = async (owner, repo, path) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    const response = await octokit.rest.repos.getContent({
        owner: owner,
        repo: repo,
        path: path,
    });
    return response.data;
};
exports.getRepoFile = getRepoFile;
