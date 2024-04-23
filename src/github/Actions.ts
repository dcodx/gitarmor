import { Endpoints } from "@octokit/types";
import { GitArmorKit } from "./GitArmorKit";
import { logger } from "../utils/Logger";
import { getRepoFile } from "./Utils";

//Get GitHub Actions permissions for a repository
export const getRepoActionsPermissions = async (
  owner: string,
  repo: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/actions/permissions"]["response"]["data"]
> => {
  try {
    const octokit = new GitArmorKit();

    const response: Endpoints["GET /repos/{owner}/{repo}/actions/permissions"]["response"] =
      await octokit.rest.actions.getGithubActionsPermissionsRepository({
        owner: owner,
        repo: repo,
      });

    return response.data;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

// Get allowed actions and reusable workflows for a repository

export const getRepoSelectedActions = async (
  owner: string,
  repo: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/actions/permissions/selected-actions"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  try {
    const response: Endpoints["GET /repos/{owner}/{repo}/actions/permissions/selected-actions"]["response"] =
      await octokit.request(
        "GET /repos/{owner}/{repo}/actions/permissions/selected-actions",
        {
          owner: owner,
          repo: repo,
        },
      );

    return response.data;
} catch (error) {
  logger.error(error.message);
  throw error;
}
};

// Get default workflow permissions for a repository

export const getRepoDefaultWorkflowsPermissions = async (
  owner: string,
  repo: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/actions/permissions/workflow"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  try {
  const response: Endpoints["GET /repos/{owner}/{repo}/actions/permissions/workflow"]["response"] =
    await octokit.rest.actions.getGithubActionsDefaultWorkflowPermissionsRepository(
      {
        owner: owner,
        repo: repo,
      },
    );

  return response.data;
} catch (error) {
  logger.error(error.message);
  throw error;
}
};

// Get the level of access for workflows outside of the repository using GET /repos/{owner}/{repo}/actions/permissions/access

export const getRepoWorkflowAccessPermissions = async (
  owner: string,
  repo: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/actions/permissions/access"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  try {
  const response: Endpoints["GET /repos/{owner}/{repo}/actions/permissions/access"]["response"] =
    await octokit.request(
      "GET /repos/{owner}/{repo}/actions/permissions/access",
      {
        owner: owner,
        repo: repo,
      },
    );

  return response.data;
} catch (error) {
  logger.error(error.message);
  throw error;
}
};

//Get all the actions used in the workflows declared in a repository and retursn the list of actions.

export const getRepoWorkflows = async (
  owner: string,
  repo: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/actions/workflows"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  try {
  const response: Endpoints["GET /repos/{owner}/{repo}/actions/workflows"]["response"] =
    await octokit.rest.actions.listRepoWorkflows({
      owner: owner,
      repo: repo,
    });

  return response.data;
} catch (error) {
  logger.error(error.message);
  throw error;
}
};

//using getRepoFile get the content of a workflow file and parse it to get the list of actions used in the workflow
//and return the list of actions used in the workflow

export const getRepoWorkflowActions = async (
  owner: string,
  repo: string,
  path: string,
): Promise<string[]> => {
  const octokit = new GitArmorKit();
  try {
  const response: Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"] =
    await octokit.rest.repos.getContent({
      owner: owner,
      repo: repo,
      path: path,
    });

  if ("content" in response.data) {
    const content = Buffer.from(response.data.content, "base64").toString(
      "ascii",
    );
    const actions = content.match(/uses: (.*)/g);
    return actions;
  } else {
    throw new Error("The specified path does not point to a file.");
  }
} catch (error) {
  logger.error(error.message);
  throw error;
}
};
