import { Endpoints } from "@octokit/types";
import { GitArmorKit } from "./GitArmorKit";

//Given a certain path in a repository, get the contents of the file
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
