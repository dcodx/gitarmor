import { Issue } from "../types/common/main";
import { GitArmorKit } from "./GitArmorKit";
import { logger } from "../utils/Logger";
// export class to Issues class
export class Issues {
  async getAllIssues(org: string, repo: string): Promise<any[]> {
    const octokit = new GitArmorKit();
    try {
    const res = await octokit.rest.issues.listForRepo({
      owner: org,
      repo: repo,
      state: "open",
    });
    return res.data; 
  }
  catch (error) {
    logger.error(error.message);
    throw error;
  }
  }
}
