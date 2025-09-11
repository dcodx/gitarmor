"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPolicy = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const logger_1 = require("../utils/logger");
const loadPolicy = async (inputs) => {
    let policy = {};
    try {
        logger_1.logger.debug(`Loading policies from: ${inputs.policy_dir}`);
        if (inputs.level === "organization_only") {
            const orgPolicyFile = fs_1.default.readFileSync(path_1.default.join(inputs.policy_dir, "organization.yml"), "utf8");
            policy.org = js_yaml_1.default.load(orgPolicyFile);
        }
        else if (inputs.level === "repository_only") {
            const repoPolicyFile = fs_1.default.readFileSync(path_1.default.join(inputs.policy_dir, "repository.yml"), "utf8");
            policy.repo = js_yaml_1.default.load(repoPolicyFile);
        }
        else if (inputs.level === "organization_and_repository") {
            // Load organization policy
            const orgPolicyFile = fs_1.default.readFileSync(path_1.default.join(inputs.policy_dir, "organization.yml"), "utf8");
            policy.org = js_yaml_1.default.load(orgPolicyFile);
            // Load repository policy
            const repoPolicyFile = fs_1.default.readFileSync(path_1.default.join(inputs.policy_dir, "repository.yml"), "utf8");
            policy.repo = js_yaml_1.default.load(repoPolicyFile);
        }
        logger_1.logger.debug("Policy:");
        logger_1.logger.debug(js_yaml_1.default.dump(policy));
    }
    catch (error) {
        logger_1.logger.error("Error loading the policy file. Please check the logs: " + error);
    }
    return policy;
};
exports.loadPolicy = loadPolicy;
