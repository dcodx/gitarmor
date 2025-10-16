"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printResultsHeader = exports.printEnhancedCheckResult = void 0;
const chalk_1 = __importDefault(require("chalk"));
const checkMetadata_1 = require("./checkMetadata");
const logger_1 = require("./logger");
/**
 * Format and print a check result with colored output and helpful links
 */
function printEnhancedCheckResult(checkResult, isOrgCheck = false, policyDir = "./policies") {
    const emoji = checkResult.pass === null ? "😐" : checkResult.pass ? "✅" : "❌";
    const statusText = checkResult.pass === null
        ? "SKIPPED"
        : checkResult.pass
            ? "PASSED"
            : "FAILED";
    const statusColor = checkResult.pass === null
        ? chalk_1.default.yellow
        : checkResult.pass
            ? chalk_1.default.green
            : chalk_1.default.red;
    // Print check header
    logger_1.logger.info(`\n${emoji} ${statusColor.bold(statusText)} - ${chalk_1.default.bold(checkResult.name)}`);
    // Get metadata for this check
    const metadata = (0, checkMetadata_1.getCheckMetadata)(checkResult.name, isOrgCheck);
    // Print GitHub documentation link
    if (metadata?.githubDocs) {
        logger_1.logger.info(`  ${chalk_1.default.blue("GitHub Docs:")} ${chalk_1.default.cyan(metadata.githubDocs)}`);
    }
    // For failed checks, print threat model and additional resources
    if (checkResult.pass === false) {
        // Print threat model reference
        if (metadata?.threatModelSection) {
            const threatFile = isOrgCheck
                ? "organization.threats.md"
                : "repository.threats.md";
            logger_1.logger.info(`  ${chalk_1.default.red("GitArmor Threat Model:")} See "${metadata.threatModelSection}" in ${threatFile}`);
        }
        // Print SLSA.dev threats
        if (metadata?.slsaThreats && metadata.slsaThreats.length > 0) {
            logger_1.logger.info(`  ${chalk_1.default.magenta("SLSA.dev Threats:")}`);
            metadata.slsaThreats.forEach((threat) => {
                logger_1.logger.info(`     - ${chalk_1.default.cyan(threat)}`);
            });
        }
        // Print MS DevOps Threat Matrix
        if (metadata?.msDevOpsThreats && metadata.msDevOpsThreats.length > 0) {
            logger_1.logger.info(`  ${chalk_1.default.magenta("MS DevOps Threat Matrix:")}`);
            metadata.msDevOpsThreats.forEach((threat) => {
                logger_1.logger.info(`     - ${chalk_1.default.cyan(threat)}`);
            });
        }
    }
    // Print check data (JSON format)
    logger_1.logger.info(`  ${chalk_1.default.gray("Data:")} ${chalk_1.default.gray(JSON.stringify(checkResult.data, null, 2))}`);
}
exports.printEnhancedCheckResult = printEnhancedCheckResult;
/**
 * Print a summary header with separator
 */
function printResultsHeader(title, separator = "=") {
    const separatorLine = separator.repeat(78);
    logger_1.logger.info(`\n${chalk_1.default.bold.cyan(separatorLine)}`);
    logger_1.logger.info(chalk_1.default.bold.cyan(title));
    logger_1.logger.info(`${chalk_1.default.bold.cyan(separatorLine)}\n`);
}
exports.printResultsHeader = printResultsHeader;
