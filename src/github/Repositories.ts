import { Endpoints } from "@octokit/types";
import { GitArmorKit } from "./GitArmorKit";
import { logger } from "../utils/logger";

export const getRepositoriesForTeamAsAdmin = async (
  org: string,
  teamSlug: string,
): Promise<Endpoints["GET /teams/{team_id}/repos"]["response"]["data"]> => {
  const octokit = new GitArmorKit();

  //get team id from slug
  const team: Endpoints["GET /orgs/{org}/teams/{team_slug}"]["response"] =
    await octokit.rest.teams.getByName({
      org: org,
      team_slug: teamSlug,
    });

  const repos: Endpoints["GET /teams/{team_id}/repos"]["response"]["data"] =
    await octokit.paginate(`GET /teams/${team.data.id}/repos`, {
      per_page: 100,
    });

  return repos.filter((repo) => repo.permissions?.admin);
};

export const getRepository = async (
  owner: string,
  repo: string,
): Promise<Endpoints["GET /repos/{owner}/{repo}"]["response"]["data"]> => {
  const octokit = new GitArmorKit();

  const response: Endpoints["GET /repos/{owner}/{repo}"]["response"] =
    await octokit.rest.repos.get({
      owner: owner,
      repo: repo,
    });

  return response.data;
};

export const getRepoPullRequests = async (
  owner: string,
  repo: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  const response: Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"] =
    await octokit.rest.pulls.list({
      owner: owner,
      repo: repo,
    });

  return response.data;
};

export const getRepoCollaborators = async (
  owner: string,
  repo: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/collaborators"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  const response: Endpoints["GET /repos/{owner}/{repo}/collaborators"]["response"] =
    await octokit.rest.repos.listCollaborators({
      owner: owner,
      repo: repo,
    });

  return response.data;
};

// get  information for a specific branch in a repo
export const getRepoBranch = async (
  owner: string,
  repo: string,
  branch: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/branches/{branch}"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  const response: Endpoints["GET /repos/{owner}/{repo}/branches/{branch}"]["response"] =
    await octokit.rest.repos.getBranch({
      owner: owner,
      repo: repo,
      branch: branch,
    });

  return response.data;
};

// get all the branches for a repo and return only the protected branches
export const getRepoProtectedBranches = async (
  owner: string,
  repo: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/branches"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  const response: Endpoints["GET /repos/{owner}/{repo}/branches"]["response"] =
    await octokit.rest.repos.listBranches({
      owner: owner,
      repo: repo,
      protected: true,
    });

  return response.data;
};

// check if a protected branch requires a pull request before merging
export const getRepoBranchProtection = async (
  owner: string,
  repo: string,
  branch: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/branches/{branch}/protection"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  const response: Endpoints["GET /repos/{owner}/{repo}/branches/{branch}/protection"]["response"] =
    await octokit.rest.repos.getBranchProtection({
      owner: owner,
      repo: repo,
      branch: branch,
    });

  return response.data;
};

//verify the presence of a file in the repository
export const getRepoFile = async (
  owner: string,
  repo: string,
  path: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  const response: Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"] =
    await octokit.rest.repos.getContent({
      owner: owner,
      repo: repo,
      path: path,
    });

  return response.data;
};

// get dependabot alerts status for a repo
export const getRepoDependabotAlerts = async (
  owner: string,
  repo: string,
): Promise<Boolean> => {
  try {
    const octokit = new GitArmorKit();
    const response: Endpoints["GET /repos/{owner}/{repo}/vulnerability-alerts"]["response"] =
      await octokit.rest.repos.checkVulnerabilityAlerts({
        owner: owner,
        repo: repo,
      });
    return response.status === 204 ? true : false;
  } catch (error) {
    if (error.status === 404) {
      return false;
    } else {
      throw error;
    }
  }
};

// get dependabot security updates status for a repo
export const getRepoDependabotSecurityUpdates = async (
  owner: string,
  repo: string,
): Promise<Boolean> => {
  try {
    const octokit = new GitArmorKit();
    const response: Endpoints["GET /repos/{owner}/{repo}/automated-security-fixes"]["response"] =
      await octokit.rest.repos.checkAutomatedSecurityFixes({
        owner: owner,
        repo: repo,
      });
    return response.status === 200 ? true : false;
  } catch (error) {
    if (error.status === 404) {
      return false;
    } else {
      throw error;
    }
  }
};

// get CodeScanning analysis for a repo
export const getRepositoryCodeScanningAnalysis = async (
  owner: string,
  repo: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/code-scanning/analyses"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  try {
    const response: Endpoints["GET /repos/{owner}/{repo}/code-scanning/analyses"]["response"] =
      await octokit.rest.codeScanning.listRecentAnalyses({
        owner: owner,
        repo: repo,
      });

    return response.data;
  } catch (error) {
    logger.debug(`Code scanning analysis fetching error: ${error.message}`);
    if (
      (error.status === 403 &&
        error.message.includes(
          "Code scanning is not enabled for this repository",
        )) ||
      error.message.includes(
        "Advanced Security must be enabled for this repository to use code scanning.",
      ) ||
      error.message.includes("no analysis found")
    ) {
      return [];
    } else {
      throw error;
    }
  }
};

// get repository rulesets for tag protection
export const getRepoRulesets = async (
  owner: string,
  repo: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/rulesets"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  try {
    const response: Endpoints["GET /repos/{owner}/{repo}/rulesets"]["response"] =
      await octokit.rest.repos.getRepoRulesets({
        owner: owner,
        repo: repo,
      });

    return response.data;
  } catch (error) {
    logger.debug(`Repository rulesets fetching error: ${error.message}`);
    if (error.status === 404) {
      return [];
    } else {
      throw error;
    }
  }
};
