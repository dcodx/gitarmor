"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitArmorKit = void 0;
const rest_1 = require("@octokit/rest");
const dotenv = __importStar(require("dotenv"));
const Logger_1 = require("../utils/Logger");
const core_1 = require("@actions/core");
dotenv.config();
class GitArmorKit extends rest_1.Octokit {
    constructor() {
        super({
            baseUrl: process.env.GITHUB_API_URL ?? "https://api.github.com",
            auth: (0, core_1.getInput)("token") || process.env.TOKEN,
            throttle: {
                onRateLimit: (retryAfter, options, octokit) => {
                    octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
                    if (options.request.retryCount <= 2) {
                        Logger_1.logger.debug(`Retrying after ${retryAfter} seconds!`);
                        return true;
                    }
                },
                onSecondaryRateLimit: (retryAfter, options, octokit) => {
                    octokit.log.warn(`Secondary rate limit for request ${options.method} ${options.url}`);
                    if (options.request.retryCount <= 2) {
                        Logger_1.logger.debug(`Secondary Limit - Retrying after ${retryAfter} seconds!`);
                        return true;
                    }
                },
            },
        });
    }
}
exports.GitArmorKit = GitArmorKit;
