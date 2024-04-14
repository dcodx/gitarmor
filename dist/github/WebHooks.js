"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebHookConfig = exports.getWebHooks = void 0;
const GitArmorKit_1 = require("./GitArmorKit");
const Logger_1 = require("../utils/Logger");
const getWebHooks = async (owner, repository) => {
    let res = [];
    try {
        const octokit = new GitArmorKit_1.GitArmorKit();
        const iterator = await octokit.paginate("GET /repos/{owner}/{repo}/hooks", {
            owner: owner,
            repo: repository,
            per_page: 100,
        }, (response) => {
            return response.data;
        });
        res = iterator;
    }
    catch (error) {
        Logger_1.logger.error(`There was an error. Please check the logs ${error}`);
    }
    return res;
};
exports.getWebHooks = getWebHooks;
// for a certain webhook get its configuration using /repos/{owner}/{repo}/hooks/{hook_id}/config endpoint
const getWebHookConfig = async (owner, repository, hook_id) => {
    let res = {};
    try {
        const octokit = new GitArmorKit_1.GitArmorKit();
        const response = await octokit.request("GET /repos/{owner}/{repo}/hooks/{hook_id}/config", {
            owner: owner,
            repo: repository,
            hook_id: hook_id,
            headers: {
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
        res = response.data;
    }
    catch (error) {
        Logger_1.logger.error(`There was an error. Please check the logs ${error}`);
    }
    return res;
};
exports.getWebHookConfig = getWebHookConfig;
