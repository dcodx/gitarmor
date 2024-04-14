import { Endpoints } from "@octokit/types";
import { CustomRepositoryRoles } from "../types/common/main";
import { GitArmorKit } from "./GitArmorKit";
import { logger } from "../utils/Logger";

// Get all repositories for an organization
export const getRepositoriesForOrg = async (
  org: string,
): Promise<Endpoints["GET /orgs/{org}/repos"]["response"]["data"]> => {
  const octokit = new GitArmorKit();

  const repos: Endpoints["GET /orgs/{org}/repos"]["response"]["data"] =
    await octokit.paginate(`GET /orgs/${org}/repos`, {
      per_page: 100,
    });

  return repos;
};

// Get general information for an organization
export const getOrganization = async (
  org: string,
): Promise<Endpoints["GET /orgs/{org}"]["response"]["data"]> => {
  const octokit = new GitArmorKit();

  const response: Endpoints["GET /orgs/{org}"]["response"] =
    await octokit.rest.orgs.get({
      org: org,
    });

  return response.data;
};

// Get custom roles information for an organization

// Get seurity managers information for an organization
export const getSecurityTeamsForOrg = async (
  org: string,
): Promise<
  Endpoints["GET /orgs/{org}/security-managers"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();

  const teams: Endpoints["GET /orgs/{org}/security-managers"]["response"]["data"] =
    await octokit.paginate(`GET /orgs/${org}/teams`, {
      per_page: 100,
    });

  return teams;
};

// Get custom repository roles information for an organization
export const getCustomRolesForOrg = async (
  org: string,
): Promise<CustomRepositoryRoles> => {
  const octokit = new GitArmorKit();

  try {
    const { data } = await octokit.request(
      `GET /orgs/{org}/custom-repository-roles`,
      {
        org: org,
        per_page: 100,
      },
    );

    return data as CustomRepositoryRoles;
  } catch (error) {
    logger.error(`Error in getCustomRolesForOrg: ${error.message}`);
    return { total_count: 0, custom_roles: [] };
  }
};
