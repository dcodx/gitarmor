import { getRepoFile } from "../../github/Repositories";
import { CheckResult, Repository } from "../../types/common/main";

export class FilesExistChecks {
  private policy: any;
  private repository: Repository;

  constructor(repository: Repository, policy: any) {
    this.repository = repository;
    this.policy = policy;
  }

  async checkFilesExist(): Promise<CheckResult> {
    const fileExistenceChecks = this.policy.file_exists.map(
      async (file: string) => {
        try {
          await getRepoFile(this.repository.owner, this.repository.name, file);
          return true;
        } catch (error) {
          return false;
        }
      },
    );

    const fileExistenceResults = await Promise.all(fileExistenceChecks);
    const missingFiles = this.policy.file_exists.filter(
      (_: string, index: number) => !fileExistenceResults[index],
    );
    const existingFiles = this.policy.file_exists.filter(
      (_: string, index: number) => fileExistenceResults[index],
    );

    return this.createResult(missingFiles, existingFiles);
  }

  private createResult(
    missingFiles: string[],
    existingFiles: string[],
  ): CheckResult {
    const name = "Files Exist Check";
    const pass = missingFiles.length === 0;

    const data = {
      passed: existingFiles,
      failed: missingFiles,
      info: {},
    };

    return { name, pass, data };
  }
}
