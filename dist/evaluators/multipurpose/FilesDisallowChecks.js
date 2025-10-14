"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesDisallowChecks = void 0;
const Repositories_1 = require("../../github/Repositories");
class FilesDisallowChecks {
    policy;
    repository;
    constructor(repository, policy) {
        this.repository = repository;
        this.policy = policy;
    }
    async checkFilesDisallow() {
        const fileDisallowChecks = this.policy.file_disallow.map(async (file) => {
            try {
                await (0, Repositories_1.getRepoFile)(this.repository.owner, this.repository.name, file);
                return { file, exists: true };
            }
            catch (error) {
                return { file, exists: false };
            }
        });
        const fileDisallowResults = await Promise.all(fileDisallowChecks);
        const foundDisallowedFiles = fileDisallowResults
            .filter((result) => result.exists)
            .map((result) => result.file);
        // Files that pass the check are the ones NOT found in the repo
        const safeFiles = this.policy.file_disallow.filter((f) => !foundDisallowedFiles.includes(f));
        return this.createResult(safeFiles, foundDisallowedFiles);
    }
    createResult(safeFiles, foundDisallowedFiles) {
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
exports.FilesDisallowChecks = FilesDisallowChecks;
