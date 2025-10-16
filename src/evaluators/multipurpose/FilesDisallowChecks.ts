import { getRepoFile } from "../../github/Repositories";
import { CheckResult, Repository } from "../../types/common/main";

export class FilesDisallowChecks {
  private policy: any;
  private repository: Repository;

  constructor(repository: Repository, policy: any) {
    this.repository = repository;
    this.policy = policy;
  }

  async checkFilesDisallow(): Promise<CheckResult> {
    const fileDisallowChecks = this.policy.file_disallow.map(
      async (file: string) => {
        try {
          await getRepoFile(this.repository.owner, this.repository.name, file);
          return { file, exists: true };
        } catch (error) {
          return { file, exists: false };
        }
      },
    );

    const fileDisallowResults = await Promise.all(fileDisallowChecks);
    const foundDisallowedFiles = fileDisallowResults
      .filter((result) => result.exists)
      .map((result) => result.file);

    // Files that pass the check are the ones NOT found in the repo
    const safeFiles = this.policy.file_disallow.filter(
      (f: string) => !foundDisallowedFiles.includes(f),
    );

    return this.createResult(safeFiles, foundDisallowedFiles);
  }

  private createResult(
    safeFiles: string[],
    foundDisallowedFiles: string[],
  ): CheckResult {
    const name = "Files Disallow Check";
    const pass = foundDisallowedFiles.length === 0;

    const data = {
      passed: safeFiles,
      failed: foundDisallowedFiles,
      info: {},
    };

    return { name, pass, data };
  }
}
