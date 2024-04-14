"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesExistChecks = void 0;
const Repositories_1 = require("../../github/Repositories");
class FilesExistChecks {
    policy;
    repository;
    constructor(repository, policy) {
        this.repository = repository;
        this.policy = policy;
    }
    async checkFilesExist() {
        const fileExistenceChecks = this.policy.file_exists.map(async (file) => {
            try {
                await (0, Repositories_1.getRepoFile)(this.repository.owner, this.repository.name, file);
                return true;
            }
            catch (error) {
                return false;
            }
        });
        const fileExistenceResults = await Promise.all(fileExistenceChecks);
        const missingFiles = this.policy.file_exists.filter((_, index) => !fileExistenceResults[index]);
        return this.createResult(missingFiles);
    }
    createResult(missingFiles) {
        let name = "Files Exist Check";
        let pass = false;
        let data = {};
        if (missingFiles.length === 0) {
            pass = true;
            data = { allFilesExist: true };
        }
        else {
            data = { missingFiles };
        }
        return { name, pass, data };
    }
}
exports.FilesExistChecks = FilesExistChecks;
