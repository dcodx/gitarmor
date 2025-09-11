"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInputs = void 0;
const core_1 = require("@actions/core");
const logger_1 = require("../utils/logger");
const parseInputs = () => {
    // read inputs from .env file or action inputs
    const inputs = {
        repo: (0, core_1.getInput)("repo") || process.env.REPO,
        org: (0, core_1.getInput)("org") || process.env.ORG,
        token: (0, core_1.getInput)("token") || process.env.TOKEN,
        level: (0, core_1.getInput)("level") || process.env.LEVEL,
        policy_dir: (0, core_1.getInput)("policy-dir") || process.env.POLICY_DIR,
        debug: (0, core_1.getInput)("debug") || process.env.DEBUG,
    };
    // validate inputs
    if (!(inputs.repo || inputs.org) ||
        !inputs.token ||
        !inputs.level ||
        !inputs.policy_dir) {
        throw new Error("You must provide required inputs. Current inputs: " +
            JSON.stringify(inputs));
    }
    logger_1.logger.debug("Inputs: " + JSON.stringify(inputs));
    return inputs;
};
exports.parseInputs = parseInputs;
