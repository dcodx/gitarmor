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
        const policyTags = this.policy.tags;
        if (!policyTags) {
            return this.createResult(true, {}, {});
        }
        // Filter to get only tag rulesets that match the policy enforcement
        const tagRulesets = rulesets.filter((ruleset) => ruleset.target === "tag" &&
            ruleset.enforcement === policyTags.enforcement);
        const checks = {
            enforcement: { passed: false, details: {} },
            scope: { passed: false, details: {} },
            operations: { passed: false, details: {} },
            naming: { passed: false, details: {} },
            bypass: { passed: false, details: {} },
        };
        // Check if we found matching rulesets
        if (tagRulesets.length === 0) {
            checks.enforcement.passed = false;
            checks.enforcement.details = {
                expected: policyTags.enforcement,
                found: "none",
            };
            return this.createResult(false, checks, {
                message: "No tag rulesets found with required enforcement level",
            });
        }
        // For simplicity, we'll check the first matching ruleset
        // In production, you might want to check all or aggregate results
        const ruleset = tagRulesets[0];
        // Check enforcement
        checks.enforcement.passed = ruleset.enforcement === policyTags.enforcement;
        checks.enforcement.details = {
            expected: policyTags.enforcement,
            actual: ruleset.enforcement,
        };
        // Check scope (include/exclude patterns)
        checks.scope = this.checkScope(policyTags.scope, ruleset.conditions);
        // Check operations (create/update/delete)
        checks.operations = this.checkOperations(policyTags.operations, ruleset);
        // Check naming constraints
        if (policyTags.naming?.enabled) {
            checks.naming = this.checkNaming(policyTags.naming, ruleset);
        }
        else {
            checks.naming.passed = true;
            checks.naming.details = { message: "Naming constraints not enabled" };
        }
        // Check bypass actors
        if (policyTags.bypass) {
            checks.bypass = this.checkBypass(policyTags.bypass, ruleset);
        }
        else {
            checks.bypass.passed = true;
            checks.bypass.details = { message: "Bypass not configured in policy" };
        }
        const allPassed = checks.enforcement.passed &&
            checks.scope.passed &&
            checks.operations.passed &&
            checks.naming.passed &&
            checks.bypass.passed;
        return this.createResult(allPassed, checks, {
            ruleset_id: ruleset.id,
            ruleset_name: ruleset.name,
        });
    }
    checkScope(policyScope, conditions) {
        const includePatterns = conditions?.ref_name?.include || [];
        const excludePatterns = conditions?.ref_name?.exclude || [];
        const expectedInclude = policyScope.include || [];
        const expectedExclude = policyScope.exclude || [];
        // Check if all expected include patterns are present
        const missingIncludes = expectedInclude.filter((pattern) => !includePatterns.includes(pattern));
        // Check if all expected exclude patterns are present
        const missingExcludes = expectedExclude.filter((pattern) => !excludePatterns.includes(pattern));
        const passed = missingIncludes.length === 0 && missingExcludes.length === 0;
        return {
            passed,
            details: {
                expected_include: expectedInclude,
                actual_include: includePatterns,
                missing_includes: missingIncludes,
                expected_exclude: expectedExclude,
                actual_exclude: excludePatterns,
                missing_excludes: missingExcludes,
            },
        };
    }
    checkOperations(policyOps, ruleset) {
        // Extract operation rules from ruleset
        const rules = ruleset.rules || [];
        const operationRules = {
            create: "allowed",
            update: "allowed",
            delete: "allowed",
        };
        // Check for creation, update, and deletion rules
        rules.forEach((rule) => {
            if (rule.type === "creation") {
                operationRules.create = "restricted";
            }
            if (rule.type === "update") {
                operationRules.update = "restricted";
            }
            if (rule.type === "deletion") {
                operationRules.delete = "restricted";
            }
        });
        const checks = {
            create: operationRules.create === policyOps.create,
            update: operationRules.update === policyOps.update,
            delete: operationRules.delete === policyOps.delete,
        };
        const passed = checks.create && checks.update && checks.delete;
        return {
            passed,
            details: {
                expected: policyOps,
                actual: operationRules,
                checks,
            },
        };
    }
    checkNaming(policyNaming, ruleset) {
        // GitHub rulesets don't have a direct naming constraint rule
        // This would need to be implemented based on specific ruleset rules
        // For now, we'll return a placeholder
        return {
            passed: true,
            details: {
                message: "Naming constraint checking not fully implemented - requires custom rule analysis",
                policy: policyNaming,
            },
        };
    }
    checkBypass(policyBypass, ruleset) {
        const bypassActors = ruleset.bypass_actors || [];
        const checks = {};
        // Check organization admins
        if (policyBypass.organization_admins) {
            const orgAdminBypass = bypassActors.find((actor) => actor.actor_type === "OrganizationAdmin");
            checks.organization_admins = {
                expected: policyBypass.organization_admins,
                found: orgAdminBypass ? orgAdminBypass.bypass_mode : "not configured",
                passed: orgAdminBypass?.bypass_mode === policyBypass.organization_admins,
            };
        }
        // Check teams
        if (policyBypass.teams) {
            checks.teams = policyBypass.teams.map((team) => {
                const teamBypass = bypassActors.find((actor) => actor.actor_type === "Team" && actor.actor_id === team.id);
                return {
                    id: team.id,
                    expected_mode: team.mode,
                    actual_mode: teamBypass ? teamBypass.bypass_mode : "not configured",
                    passed: teamBypass?.bypass_mode === team.mode,
                };
            });
        }
        // Check integrations
        if (policyBypass.integrations) {
            checks.integrations = policyBypass.integrations.map((integration) => {
                const integrationBypass = bypassActors.find((actor) => actor.actor_type === "Integration" &&
                    actor.actor_id === integration.id);
                return {
                    id: integration.id,
                    expected_mode: integration.mode,
                    actual_mode: integrationBypass
                        ? integrationBypass.bypass_mode
                        : "not configured",
                    passed: integrationBypass?.bypass_mode === integration.mode,
                };
            });
        }
        // Check repository roles
        if (policyBypass.repository_roles) {
            checks.repository_roles = policyBypass.repository_roles.map((role) => {
                const roleBypass = bypassActors.find((actor) => actor.actor_type === "RepositoryRole" &&
                    actor.actor_id === role.id);
                return {
                    id: role.id,
                    expected_mode: role.mode,
                    actual_mode: roleBypass ? roleBypass.bypass_mode : "not configured",
                    passed: roleBypass?.bypass_mode === role.mode,
                };
            });
        }
        // Check deploy keys
        if (policyBypass.deploy_keys) {
            const deployKeyBypass = bypassActors.find((actor) => actor.actor_type === "DeployKey");
            checks.deploy_keys = {
                expected_allow: policyBypass.deploy_keys.allow,
                expected_mode: policyBypass.deploy_keys.mode,
                found: deployKeyBypass ? "configured" : "not configured",
                actual_mode: deployKeyBypass
                    ? deployKeyBypass.bypass_mode
                    : "not configured",
                passed: policyBypass.deploy_keys.allow === !!deployKeyBypass &&
                    (!deployKeyBypass ||
                        deployKeyBypass.bypass_mode === policyBypass.deploy_keys.mode),
            };
        }
        // Determine if all bypass checks passed
        const allBypassPassed = Object.values(checks).every((check) => {
            if (Array.isArray(check)) {
                return check.every((item) => item.passed);
            }
            return check.passed;
        });
        return {
            passed: allBypassPassed,
            details: checks,
        };
    }
    createResult(passed, checks, info) {
        const name = "Tag Protection";
        // Determine which checks passed and failed
        const passedChecks = [];
        const failedChecks = {};
        Object.entries(checks).forEach(([key, value]) => {
            if (value.passed) {
                passedChecks.push(key);
            }
            else {
                failedChecks[key] = value.details;
            }
        });
        const data = {
            passed: passedChecks,
            failed: failedChecks,
            info,
        };
        return { name, pass: passed, data };
    }
}
exports.TagProtectionChecks = TagProtectionChecks;
