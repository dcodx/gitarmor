import { GitArmorKit } from "./GitArmorKit";

// export class to Issues class
export class Issues {
  async getAllIssues(org: string, repo: string): Promise<any[]> {
    const octokit = new GitArmorKit();
    const res = await octokit.rest.issues.listForRepo({
      owner: org,
      repo: repo,
      state: "open",
    });
    return res.data;
  }
}
