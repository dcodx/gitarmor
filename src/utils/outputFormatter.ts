import chalk from "chalk";
import { CheckResult } from "../types/common/main";
import { getCheckMetadata } from "./checkMetadata";
import { logger } from "./logger";

/**
 * Format and print a check result with colored output and helpful links
 */
export function printEnhancedCheckResult(
  checkResult: CheckResult,
  isOrgCheck: boolean = false,
  policyDir: string = "./policies",
): void {
  const emoji =
    checkResult.pass === null ? "😐" : checkResult.pass ? "✅" : "❌";
  const statusText =
    checkResult.pass === null
      ? "SKIPPED"
      : checkResult.pass
        ? "PASSED"
        : "FAILED";
  const statusColor =
    checkResult.pass === null
      ? chalk.yellow
      : checkResult.pass
        ? chalk.green
        : chalk.red;

  // Print check header
  logger.info(
    `\n${emoji} ${statusColor.bold(statusText)} - ${chalk.bold(checkResult.name)}`,
  );

  // Get metadata for this check
  const metadata = getCheckMetadata(checkResult.name, isOrgCheck);

  // Print GitHub documentation link
  if (metadata?.githubDocs) {
    logger.info(
      `  ${chalk.blue("📘 GitHub Docs:")} ${chalk.cyan(metadata.githubDocs)}`,
    );
  }

  // For failed checks, print threat model and additional resources
  if (checkResult.pass === false) {
    // Print threat model reference
    if (metadata?.threatModelSection) {
      const threatFile = isOrgCheck
        ? "organization.threats.md"
        : "repository.threats.md";
      logger.info(
        `  ${chalk.red("⚠️  Threat Model:")} See "${metadata.threatModelSection}" in ${threatFile}`,
      );
    }

    // Print SLSA.dev threats
    if (metadata?.slsaThreats && metadata.slsaThreats.length > 0) {
      logger.info(`  ${chalk.magenta("🔗 SLSA.dev Threats:")}`);
      metadata.slsaThreats.forEach((threat) => {
        logger.info(`     - ${chalk.cyan(threat)}`);
      });
    }

    // Print MS DevOps Threat Matrix
    if (metadata?.msDevOpsThreats && metadata.msDevOpsThreats.length > 0) {
      logger.info(`  ${chalk.magenta("🔗 MS DevOps Threat Matrix:")}`);
      metadata.msDevOpsThreats.forEach((threat) => {
        logger.info(`     - ${chalk.cyan(threat)}`);
      });
    }
  }

  // Print check data (JSON format)
  logger.info(
    `  ${chalk.gray("Data:")} ${chalk.gray(JSON.stringify(checkResult.data, null, 2))}`,
  );
}

/**
 * Print a summary header with separator
 */
export function printResultsHeader(
  title: string,
  separator: string = "=",
): void {
  const separatorLine = separator.repeat(78);
  logger.info(`\n${chalk.bold.cyan(separatorLine)}`);
  logger.info(chalk.bold.cyan(title));
  logger.info(`${chalk.bold.cyan(separatorLine)}\n`);
}
