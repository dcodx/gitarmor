import { Endpoints } from "@octokit/types";
import { GitArmorKit } from "./GitArmorKit";
import { logger } from "../utils/Logger";

//List self-hosted runners for a repository
export const getRepoRunners = async (
  owner: string,
  repo: string,
): Promise<
  Endpoints["GET /repos/{owner}/{repo}/actions/runners"]["response"]["data"]
> => {
  const octokit = new GitArmorKit();
  try{
  const response: Endpoints["GET /repos/{owner}/{repo}/actions/runners"]["response"] =
    await octokit.rest.actions.listSelfHostedRunnersForRepo({
      owner: owner,
      repo: repo,
    });

  return response.data;
} catch (error) {
  logger.error(error.message);
  throw error;
}
};
