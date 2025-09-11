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
        if (this.policy.advanced_security.ghas) {
            return this.getStatusForFeature("advanced_security");
        }
    }
    checkRepositorySecretScanning() {
        if (this.policy.advanced_security.secret_scanning) {
            return this.getStatusForFeature("secret_scanning");
        }
    }
    checkRepositorySecretScanningPushProtection() {
        if (this.policy.advanced_security.secret_scanning_push_protection) {
            return this.getStatusForFeature("secret_scanning_push_protection");
        }
    }
    checkRepositorySecretScanningValidityChecks() {
        if (this.policy.advanced_security.secret_scanning_validity_check) {
            return this.getStatusForFeature("secret_scanning_validity_checks");
        }
    }
    async checkRepositoryCodeScanning() {
        try {
            if (this.policy.advanced_security.code_scanning) {
                const recentAnalysis = await (0, Repositories_1.getRepositoryCodeScanningAnalysis)(this.repository.owner, this.repository.name);
                if (recentAnalysis.length > 0) {
                    return true;
                }
            }
            return false;
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
        if (this.policy.advanced_security.dependabot_alerts) {
            const dependabot = await (0, Repositories_1.getRepoDependabotAlerts)(this.repository.owner, this.repository.name);
            if (dependabot) {
                return true;
            }
            else {
                return false;
            }
        }
    }
    async checkRepositoryDependabotSecurityUpdates() {
        if (this.policy.advanced_security.dependabot_security_updates) {
            const dependabotSecurityUpdates = await (0, Repositories_1.getRepoDependabotSecurityUpdates)(this.repository.owner, this.repository.name);
            if (dependabotSecurityUpdates) {
                return true;
            }
            else {
                return false;
            }
        }
    }
    async evaluate() {
        const checks = {
            ghas: this.checkRepositoryGHASstatus(),
            secret_scanning: this.checkRepositorySecretScanning(),
            secret_scanning_push_protection: this.checkRepositorySecretScanningPushProtection(),
            secret_scanning_validity_check: this.checkRepositorySecretScanningValidityChecks(),
            code_scanning: await this.checkRepositoryCodeScanning(),
            dependabot: await this.checkRepositoryDependabotAlerts(),
            dependabot_security_updates: await this.checkRepositoryDependabotSecurityUpdates(),
        };
        let name = "GHAS Checks";
        let pass = false;
        let data = {};
        pass = Object.values(checks).every((check) => check === true);
        data = checks;
        return { name, pass, data };
    }
}
exports.GHASChecks = GHASChecks;
