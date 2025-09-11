import { GitArmorKit } from "./GitArmorKit";
import { DependancyAlert } from "../types/common/main";
import { logger } from "../utils/logger";

export const DependabotAlerts = async (
  owner: string,
  repository: string,
): Promise<DependancyAlert[]> => {
  let res: Array<DependancyAlert> = [];
  try {
    const octokit = new GitArmorKit();
    const iterator = await octokit.paginate(
      "GET /repos/{owner}/{repo}/dependabot/alerts",
      {
        owner: owner,
        repo: repository,
        per_page: 100,
      },
      (response) => {
        return response.data;
      },
    );
    res = iterator as DependancyAlert[];
  } catch (error) {
    logger.error(`There was an error. Please check the logs ${error}`);
  }
  return res;
};
