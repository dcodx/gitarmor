"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagProtectionChecks = void 0;
const Repositories_1 = require("../../github/Repositories");
class TagProtectionChecks {
    policy;
    repository;
    constructor(policy, repository) {
        this.policy = policy;
        this.repository = repository;
    }
    async checkTagProtection() {
        const rulesets = await (0, Repositories_1.getRepoRulesets)(this.repository.owner, this.repository.name);
        // Filter to get only tag rulesets that are active
        const tagRulesets = rulesets.filter((ruleset) => ruleset.target === "tag" && ruleset.enforcement === "active");
        const policyTags = this.policy.protected_tags || [];
        const protectedTagPatterns = tagRulesets
            .map((ruleset) => {
            // Extract tag patterns from conditions
            if (ruleset.conditions?.ref_name?.include) {
                return ruleset.conditions.ref_name.include;
            }
            return [];
        })
            .flat();
        // Check which policy tags are protected
        const passedTags = [];
        const failedTags = [];
        for (const policyTag of policyTags) {
            const isProtected = this.isTagProtected(policyTag.name, protectedTagPatterns);
            if (isProtected) {
                passedTags.push(policyTag.name);
            }
            else {
                failedTags.push(policyTag.name);
            }
        }
        return this.createResult(passedTags, failedTags, protectedTagPatterns);
    }
    isTagProtected(tagName, protectedPatterns) {
        // Check if tag name matches any protected pattern
        for (const pattern of protectedPatterns) {
            if (pattern === "~ALL") {
                return true;
            }
            // Convert GitHub pattern to regex
            const regexPattern = pattern
                .replace(/\*/g, ".*")
                .replace(/\?/g, ".")
                .replace(/\[/g, "\\[")
                .replace(/\]/g, "\\]");
            const regex = new RegExp(`^${regexPattern}$`);
            if (regex.test(tagName)) {
                return true;
            }
        }
        return false;
    }
    createResult(passed, failed, protectedPatterns) {
        const name = "Tag Protection";
        const pass = failed.length === 0;
        const data = {
            passed,
            failed: {
                not_protected: failed,
            },
            info: {
                protected_patterns: protectedPatterns,
            },
        };
        return { name, pass, data };
    }
}
exports.TagProtectionChecks = TagProtectionChecks;
