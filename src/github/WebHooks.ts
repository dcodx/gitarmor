import { GitArmorKit } from "./GitArmorKit";
import { WebHook, WebHookConfig } from "../types/common/main";
import { logger } from "../utils/Logger";

export const getWebHooks = async (
  owner: string,
  repository: string,
): Promise<WebHook[]> => {
  let res: Array<WebHook> = [];
  try {
    const octokit = new GitArmorKit();
    const iterator = await octokit.paginate(
      "GET /repos/{owner}/{repo}/hooks",
      {
        owner: owner,
        repo: repository,
        per_page: 100,
      },
      (response) => {
        return response.data;
      },
    );
    res = iterator as WebHook[];
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
  return res;
};

// for a certain webhook get its configuration using /repos/{owner}/{repo}/hooks/{hook_id}/config endpoint
export const getWebHookConfig = async (
  owner: string,
  repository: string,
  hook_id: number,
): Promise<WebHookConfig> => {
  let res: any = {};
  try {
    const octokit = new GitArmorKit();
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/hooks/{hook_id}/config",
      {
        owner: owner,
        repo: repository,
        hook_id: hook_id,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
    res = response.data;
  } catch (error) {
    logger.error(`There was an error. Please check the logs ${error}`);
  }
  return res;
};
