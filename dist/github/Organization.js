"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomRolesForOrg = exports.getSecurityTeamsForOrg = exports.getOrganization = exports.getRepositoriesForOrg = void 0;
const GitArmorKit_1 = require("./GitArmorKit");
const logger_1 = require("../utils/logger");
// Get all repositories for an organization
const getRepositoriesForOrg = async (org) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    const repos = await octokit.paginate(`GET /orgs/${org}/repos`, {
        per_page: 100,
    });
    return repos;
};
exports.getRepositoriesForOrg = getRepositoriesForOrg;
// Get general information for an organization
const getOrganization = async (org) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    const response = await octokit.rest.orgs.get({
        org: org,
    });
    return response.data;
};
exports.getOrganization = getOrganization;
// Get custom roles information for an organization
// Get seurity managers information for an organization
const getSecurityTeamsForOrg = async (org) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    const teams = await octokit.paginate(`GET /orgs/${org}/teams`, {
        per_page: 100,
    });
    return teams;
};
exports.getSecurityTeamsForOrg = getSecurityTeamsForOrg;
// Get custom repository roles information for an organization
const getCustomRolesForOrg = async (org) => {
    const octokit = new GitArmorKit_1.GitArmorKit();
    try {
        const { data } = await octokit.request(`GET /orgs/{org}/custom-repository-roles`, {
            org: org,
            per_page: 100,
        });
        return data;
    }
    catch (error) {
        logger_1.logger.error(`Error in getCustomRolesForOrg: ${error.message}`);
        return { total_count: 0, custom_roles: [] };
    }
};
exports.getCustomRolesForOrg = getCustomRolesForOrg;
