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
        // Check if disallowed files are in .gitignore
        const gitignoreStatus = await this.checkGitignore(foundDisallowedFiles);
        return this.createResult(foundDisallowedFiles, gitignoreStatus);
    }
    async checkGitignore(disallowedFiles) {
        if (disallowedFiles.length === 0) {
            return { hasGitignore: false, missingInGitignore: [] };
        }
        try {
            const gitignoreContent = await (0, Repositories_1.getRepoFile)(this.repository.owner, this.repository.name, ".gitignore");
            // Decode the base64 content
            let gitignoreText = "";
            if ("content" in gitignoreContent && gitignoreContent.content) {
                gitignoreText = Buffer.from(gitignoreContent.content, "base64").toString("utf-8");
            }
            // Parse .gitignore patterns
            const gitignorePatterns = gitignoreText
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith("#"));
            // Check which disallowed files are NOT in .gitignore
            const missingInGitignore = disallowedFiles.filter((file) => {
                return !gitignorePatterns.some((pattern) => {
                    // Simple pattern matching - check exact match or pattern prefix
                    if (pattern === file)
                        return true;
                    // Handle patterns like .env* that would match .env
                    if (pattern.endsWith("*") && file.startsWith(pattern.slice(0, -1)))
                        return true;
                    // Handle directory patterns
                    if (pattern.endsWith("/") && file.startsWith(pattern))
                        return true;
                    return false;
                });
            });
            return { hasGitignore: true, missingInGitignore };
        }
        catch (error) {
            // .gitignore doesn't exist
            return {
                hasGitignore: false,
                missingInGitignore: disallowedFiles,
            };
        }
    }
    createResult(foundDisallowedFiles, gitignoreStatus) {
        let name = "Files Disallow Check";
        let pass = false;
        let data = {};
        if (foundDisallowedFiles.length === 0) {
            pass = true;
            data = { noDisallowedFilesFound: true };
        }
        else {
            data = {
                foundDisallowedFiles,
                gitignoreExists: gitignoreStatus.hasGitignore,
                missingInGitignore: gitignoreStatus.missingInGitignore,
            };
        }
        return { name, pass, data };
    }
}
exports.FilesDisallowChecks = FilesDisallowChecks;
