import { CheckResult, Repository } from "../../types/common/main";
import {
  getRepoDefaultWorkflowsPermissions,
  getRepoWorkflowAccessPermissions,
} from "../../github/Actions";
import { logger } from "../../utils/logger";

export class WorkflowsChecks {
  private policy: any;
  private repository: Repository;

  constructor(policy: any, repository: Repository) {
    this.policy = policy;
    this.repository = repository;
  }

  async checkWorkflowsDefaultPermissions(): Promise<any> {
    const workflowsPermissions = await getRepoDefaultWorkflowsPermissions(
      this.repository.owner,
      this.repository.name,
    );
    const workflowsPermissionsResult =
      workflowsPermissions.default_workflow_permissions;
    const workflowsPermissionsApprovePullRequests =
      workflowsPermissions.can_approve_pull_request_reviews;
    const workflowsPermissionsPolicy = this.policy.workflows.permission;
    const workflowsPermissionsPolicyApprovePullRequests =
      this.policy.workflows.approve_pull_requests;

    return this.createWorkflowsDefaultPermissionsResult(
      workflowsPermissionsResult == workflowsPermissionsPolicy,
      workflowsPermissionsApprovePullRequests ==
        workflowsPermissionsPolicyApprovePullRequests,
    );
  }

  async checkWorkflowsAccessPermissions(): Promise<any> {
    try {
      const workflowsAccessPermissions = await getRepoWorkflowAccessPermissions(
        this.repository.owner,
        this.repository.name,
      );
      const workflowsAccessPermissionsResult =
        workflowsAccessPermissions.access_level;
      logger.debug(
        `Workflow access permissions result: ${workflowsAccessPermissionsResult}`,
      );
      const workflowsAccessPermissionsPolicy =
        this.policy.workflows.access_level;
      return this.createWorkflowsAccessPermissionsResult(
        workflowsAccessPermissionsResult == workflowsAccessPermissionsPolicy,
      );
    } catch (error) {
      logger.error(`not available for public repositories`);
      return this.createWorkflowsAccessPermissionsResult(
        false,
        "not available for public repositories",
      );
    }
  }

  private createWorkflowsDefaultPermissionsResult(
    workflows_permissions: boolean,
    can_approve_pull_request_reviews: boolean,
  ): CheckResult {
    let name = "Workflows Default Permissions Check";
    let pass = false;
    let data = {};
    if (workflows_permissions && can_approve_pull_request_reviews) {
      pass = true;
      data = {
        workflows_permissions: true,
        can_approve_pull_request_reviews: true,
      };
    } else {
      data = { workflows_permissions, can_approve_pull_request_reviews };
    }

    return { name, pass, data };
  }

  private createWorkflowsAccessPermissionsResult(
    access_permissions: boolean,
    error?: string,
  ): CheckResult {
    let name = "Workflows Access Permissions Check";
    let pass = false;
    let data = {};

    if (access_permissions) {
      pass = true;
      data = { access_permissions: true };
    } else {
      data = { access_permissions, error };
    }

    return { name, pass, data };
  }
}
