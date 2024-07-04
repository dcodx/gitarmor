import { Policy, Inputs } from "../types/common/main";
import { OrgPolicyEvaluator } from "../evaluators/OrgPolicyEvaluator";
import { RepoPolicyEvaluator } from "../evaluators/RepoPolicyEvaluator";
import { logger } from "./../utils/Logger";
import fs from "fs";

export class Report {
  private orgEvaluators: Map<OrgPolicyEvaluator, RepoPolicyEvaluator[]>;
  private repoEvaluator: RepoPolicyEvaluator;
  private policies: Policy;
  private inputs: Inputs;
  private finalReportText: string = "";
  private finalReportJson: any = {};

  constructor(
    orgEvaluators: Map<OrgPolicyEvaluator, RepoPolicyEvaluator[]> = new Map(),
    repoEvaluator: RepoPolicyEvaluator = null,
    policies: Policy = {},
    inputs: Inputs = {},
    finalReportText: string = "",
    finalReportJson: any = {},
  ) {
    this.orgEvaluators = orgEvaluators;
    this.repoEvaluator = repoEvaluator;
    this.policies = policies || {};
    this.inputs = inputs;
    this.finalReportText = finalReportText;
    this.finalReportJson = finalReportJson;
  }

  public getReportText(): string {
    return this.finalReportText;
  }

  public getReportJson(): any {
    return this.finalReportJson;
  }

  public addOrgEvaluator(orgEvaluator: OrgPolicyEvaluator): void {
    this.orgEvaluators.set(orgEvaluator, []);
  }

  public addRepoEvaluatorToOrg(
    orgEvaluator: OrgPolicyEvaluator,
    repoEvaluator: RepoPolicyEvaluator,
  ): void {
    const repoEvaluators = this.orgEvaluators.get(orgEvaluator);
    if (repoEvaluators) {
      repoEvaluators.push(repoEvaluator);
    }
  }

  public writeReportToFile(): void {
    if (this.finalReportText && this.finalReportJson) {
      fs.writeFileSync("output-report.md", this.finalReportText);
      fs.writeFileSync(
        "output-report.json",
        JSON.stringify(this.finalReportJson, null, 2),
      );
      logger.info(
        "Report written to file: output-report.md and output-report.json",
      );
    } else {
      logger.error("No report to write");
    }
  }

  public addOneRepoEvaluator(repoEvaluator: RepoPolicyEvaluator): void {
    this.repoEvaluator = repoEvaluator;
  }

  public addPolicy(policy: Policy): void {
    this.policies = policy;
  }

  public addInput(input: Inputs): void {
    this.inputs = input;
  }
  public prepareReports(): void {
    let report = "# 🛡️ GitArmor Evaluation Report 🚀\n\n";
    report +=
      "This is GitArmor report that provides a detailed assessment of your organization's \
       and/or repositories' compliance with security and operational policies. We've broken down the \
      results into clear sections and included  Let's dive into the findings! 🤿 \n\n";
    let jsonReport: any = {};

    // Evaluation section
    report += "## 📑 Detailed Evaluation Findings \n\n";
    if (this.inputs.level === "repository_only") {
      report += "### 📁 Repository Evaluator\n\n";
      report += this.formatRepoEvaluator(this.repoEvaluator);
      jsonReport.repoEvaluator = this.repoEvaluator; // Corrected typo from 'repoEvalator' to 'repoEvaluator'
    } else if (this.inputs.level === "organization_only") {
      report += "### 🏢 Organization Evaluator\n\n";
      this.orgEvaluators.forEach((repoEvaluators, orgEvaluator) => {
        report += this.formatOrgEvaluator(orgEvaluator, repoEvaluators);
      });

      const orgEvaluatorsJson = Array.from(this.orgEvaluators.entries()).map(([orgEvaluator]) => ({
        orgEvaluator: JSON.stringify(orgEvaluator),
      }));
      jsonReport.orgEvaluators = orgEvaluatorsJson;
    } else if (this.inputs.level === "organization_and_repository") {
      report += "### 🏢 Organization Evaluator\n\n";
      this.orgEvaluators.forEach((repoEvaluators, orgEvaluator) => {
        report += this.formatOrgEvaluator(orgEvaluator,repoEvaluators);
        repoEvaluators.forEach((repoEvaluator) => {
          report += this.formatRepoEvaluator(repoEvaluator);
        });
      });

      const orgEvaluatorsJson = Array.from(this.orgEvaluators.entries()).map(
        ([orgEvaluator, repoEvaluators]) => ({
          orgEvaluator: JSON.stringify(orgEvaluator),
          repoEvaluators: repoEvaluators.map((repoEvaluator) =>
            JSON.stringify(repoEvaluator),
          ),
        }),
      );
      jsonReport.orgEvaluators = orgEvaluatorsJson;
    }

    // Policy section
    report +=
      "## 📜 Policy\n\n This section outlines the detailed policy configurations \
      applied to the organization and repositories, providing a blueprint for expected\
       security and operational standards.\n\n";
    report += this.formatPolicy(this.policies);
    jsonReport.policies = this.policies;

    // TODO: If useful, include inputs in the report; Remove token from inputs before including in the report
    // // Inputs section
    // report += '## Inputs\n\n';
    // report += this.formatInputs(this.inputs);
    // jsonReport.inputs = this.inputs;

    // include timestamp in the report
    const date = new Date();
    report += `---\n\n__Report generated on ${date.toDateString()} at ${date.toTimeString()}__\n\n`;
    jsonReport.timestamp = date.toISOString();

    this.finalReportText = report;
    this.finalReportJson = jsonReport;
  }

  private formatOrgEvaluator(
    orgEvaluator: OrgPolicyEvaluator,
    repoEvaluators: RepoPolicyEvaluator[],
  ): string {
    let formattedData = "";

    // Format orgEvaluator data
    formattedData += this.formatOrgEvaluatorChecks(orgEvaluator);

    // Format repoEvaluators data
    repoEvaluators.forEach((repoEvaluator) => {
      formattedData += this.formatRepoEvaluator(repoEvaluator);
    });

    return formattedData;
  }

  private formatOrgEvaluatorChecks(evaluator: OrgPolicyEvaluator): string {
    const checkResults = evaluator.getCheckResults();
    let table = `### Organization Evaluation for: \`${evaluator.getOrganizationName()}\`\n\n`;
    table += "| Name | Pass | Data |\n";
    table += "| ---- | ---- | ---- |\n";

    checkResults.forEach((result) => {
      const data = this.insertLineBreaks(JSON.stringify(result.data), 80);
      table += `| ${result.name} | ${result.pass ? "✅" : "❌"} | *${data}* |\n`;
    });

    return table;
  }

  private formatRepoEvaluator(evaluator: RepoPolicyEvaluator): string {
    const checkResults = evaluator.getCheckResults();
    let table = `### Repository Evaluation for: \`${evaluator.getFullRepositoryName()}\`\n\n`;
    table += "| Name | Pass | Data |\n";
    table += "| ---- | ---- | ---- |\n";

    checkResults.forEach((result) => {
      const data = this.insertLineBreaks(JSON.stringify(result.data), 80);
      table += `| ${result.name} | ${result.pass ? "✅" : "❌"} | *${data}* |\n`;
    });

    return table;
  }

  private insertLineBreaks(text: string, lineLength: number): string {
    let result = "";
    let count = 0;

    for (let i = 0; i < text.length; i++) {
      result += text[i];
      count++;

      if (count === lineLength && text[i] !== " ") {
        result += "<br>";
        count = 0;
      }
    }

    return result;
  }

  private formatPolicy(policy: Policy): String {
    return `### Policy Overview \n\n\`\`\`${JSON.stringify(this.policies, null, 2)}\n\`\`\`\n\n`;
  }

  private formatInputs(inputs: Inputs): String {
    return `### Inputs\n\n\`\`\`${JSON.stringify(this.inputs, null, 2)}\n\`\`\`\n\n`;
  }
}
