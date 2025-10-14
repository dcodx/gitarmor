"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunnersChecks = void 0;
const Runners_1 = require("../../github/Runners");
class RunnersChecks {
    policy;
    repository;
    constructor(policy, repository) {
        this.policy = policy;
        this.repository = repository;
    }
    // check whether the repository has self hosted runners enabled
    async checkRunnersPermissions() {
        const runners = await (0, Runners_1.getRepoRunners)(this.repository.owner, this.repository.name);
        const policy = this.policy.runners || {};
        const passed = [];
        const failed = {};
        const info = { runners_defined: runners.total_count };
        // self_hosted_allowed: if false in policy, there must be zero runners
        if (typeof policy.self_hosted_allowed === "boolean") {
            if (policy.self_hosted_allowed === false) {
                if (runners.total_count === 0) {
                    passed.push("self_hosted_allowed");
                }
                else {
                    failed.self_hosted_allowed = false;
                }
            }
            else {
                // Policy allows self-hosted; presence is fine
                passed.push("self_hosted_allowed");
            }
        }
        // self_hosted_allowed_os: if provided, ensure all runner OS are whitelisted
        const allowedOs = policy.self_hosted_allowed_os;
        if (Array.isArray(allowedOs)) {
            const osViolations = (runners.runners || [])
                .filter((r) => !allowedOs.includes(r.os))
                .map((r) => ({ id: r.id, name: r.name, os: r.os }));
            if (osViolations.length === 0) {
                passed.push("self_hosted_allowed_os");
            }
            else {
                failed.self_hosted_allowed_os = osViolations;
            }
        }
        // self_hosted_allowed_labels: if provided, ensure each runner's labels are subset of allowed
        const allowedLabels = policy.self_hosted_allowed_labels;
        if (Array.isArray(allowedLabels)) {
            const labelViolations = (runners.runners || [])
                .map((r) => {
                const runnerLabels = (r.labels || []).map((l) => l.name || l);
                const disallowed = runnerLabels.filter((lbl) => !allowedLabels.includes(lbl));
                return disallowed.length > 0
                    ? {
                        id: r.id,
                        name: r.name,
                        os: r.os,
                        disallowed_labels: disallowed,
                    }
                    : null;
            })
                .filter((v) => v !== null);
            if (labelViolations.length === 0) {
                passed.push("self_hosted_allowed_labels");
            }
            else {
                failed.self_hosted_allowed_labels = labelViolations;
            }
        }
        return this.createResult(passed, failed, info);
    }
    createResult(passed, failed, info) {
        const name = "Runners Check";
        const pass = Object.keys(failed).length === 0;
        const data = { passed, failed, info };
        return { name, pass, data };
    }
}
exports.RunnersChecks = RunnersChecks;
