"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GHASChecks = void 0;
const Repositories_1 = require("../../github/Repositories");
const logger_1 = require("../../utils/logger");
class GHASChecks {
    policy;
    repository;
    repositoryData;
    constructor(policy, repository, repositoryData) {
        this.policy = policy;
        this.repository = repository;
        this.repositoryData = repositoryData;
    }
    checkRepositoryGHASstatus() {
        logger_1.logger.debug(`Checking GHAS status for ${this.repository.owner}/${this.repository.name}`);
        return this.getStatusForFeature("advanced_security");
    }
    checkRepositorySecretScanning() {
        return this.getStatusForFeature("secret_scanning");
    }
    checkRepositorySecretScanningPushProtection() {
        return this.getStatusForFeature("secret_scanning_push_protection");
    }
    checkRepositorySecretScanningValidityChecks() {
        return this.getStatusForFeature("secret_scanning_validity_checks");
    }
    async checkRepositoryCodeScanning() {
        try {
            const recentAnalysis = await (0, Repositories_1.getRepositoryCodeScanningAnalysis)(this.repository.owner, this.repository.name);
            return recentAnalysis.length > 0;
        }
        catch (error) {
            throw new Error(`Error in checkRepositoryCodeScanning: ${error}`);
        }
    }
    getStatusForFeature(feature) {
        try {
            if (!this.repositoryData.organization) {
                if (this.repositoryData.private) {
                    return false;
                }
                else {
                    if (feature === "advanced_security") {
                        return true;
                    }
                }
            }
            if (this.repositoryData.security_and_analysis) {
                const status = this.repositoryData.security_and_analysis[feature]?.status;
                return status === "enabled";
            }
            return false;
        }
        catch (error) {
            throw new Error(`Error in getStatusForFeature: ${error}`);
        }
    }
    async checkRepositoryDependabotAlerts() {
        const dependabot = await (0, Repositories_1.getRepoDependabotAlerts)(this.repository.owner, this.repository.name);
        return !!dependabot;
    }
    async checkRepositoryDependabotSecurityUpdates() {
        const dependabotSecurityUpdates = await (0, Repositories_1.getRepoDependabotSecurityUpdates)(this.repository.owner, this.repository.name);
        return !!dependabotSecurityUpdates;
    }
    async evaluate() {
        const asPolicy = this.policy?.advanced_security || {};
        const evaluators = {
            ghas: () => this.checkRepositoryGHASstatus(),
            secret_scanning: () => this.checkRepositorySecretScanning(),
            secret_scanning_push_protection: () => this.checkRepositorySecretScanningPushProtection(),
            secret_scanning_validity_check: () => this.checkRepositorySecretScanningValidityChecks(),
            code_scanning: () => this.checkRepositoryCodeScanning(),
            dependabot_alerts: () => this.checkRepositoryDependabotAlerts(),
            dependabot_security_updates: () => this.checkRepositoryDependabotSecurityUpdates(),
        };
        const keysToEvaluate = Object.keys(asPolicy).filter((k) => k in evaluators && typeof asPolicy[k] === "boolean");
        const passed = [];
        const failed = [];
        await Promise.all(keysToEvaluate.map(async (key) => {
            try {
                const actual = await evaluators[key]();
                const desired = !!asPolicy[key];
                if (actual === desired) {
                    passed.push(key);
                }
                else {
                    failed.push(key);
                }
            }
            catch (e) {
                failed.push(key);
                logger_1.logger.debug(`GHAS check error for ${key}: ${e}`);
            }
        }));
        const name = "GHAS Checks";
        const pass = failed.length === 0;
        const data = { passed, failed, info: {} };
        return { name, pass, data };
    }
}
exports.GHASChecks = GHASChecks;
