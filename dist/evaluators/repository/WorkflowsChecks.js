"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsChecks = void 0;
const Actions_1 = require("../../github/Actions");
const Logger_1 = require("../../utils/Logger");
class WorkflowsChecks {
    policy;
    repository;
    constructor(policy, repository) {
        this.policy = policy;
        this.repository = repository;
    }
    async checkWorkflowsDefaultPermissions() {
        const workflowsPermissions = await (0, Actions_1.getRepoDefaultWorkflowsPermissions)(this.repository.owner, this.repository.name);
        const workflowsPermissionsResult = workflowsPermissions.default_workflow_permissions;
        const workflowsPermissionsApprovePullRequests = workflowsPermissions.can_approve_pull_request_reviews;
        const workflowsPermissionsPolicy = this.policy.workflows.permission;
        const workflowsPermissionsPolicyApprovePullRequests = this.policy.workflows.approve_pull_requests;
        return this.createWorkflowsDefaultPermissionsResult(workflowsPermissionsResult == workflowsPermissionsPolicy, workflowsPermissionsApprovePullRequests ==
            workflowsPermissionsPolicyApprovePullRequests);
    }
    async checkWorkflowsAccessPermissions() {
        try {
            const workflowsAccessPermissions = await (0, Actions_1.getRepoWorkflowAccessPermissions)(this.repository.owner, this.repository.name);
            const workflowsAccessPermissionsResult = workflowsAccessPermissions.access_level;
            Logger_1.logger.debug(`Workflow access permissions result: ${workflowsAccessPermissionsResult}`);
            const workflowsAccessPermissionsPolicy = this.policy.workflows.access_level;
            return this.createWorkflowsAccessPermissionsResult(workflowsAccessPermissionsResult == workflowsAccessPermissionsPolicy);
        }
        catch (error) {
            Logger_1.logger.error(`not available for public repositories`);
            return this.createWorkflowsAccessPermissionsResult(false, "not available for public repositories");
        }
    }
    createWorkflowsDefaultPermissionsResult(workflows_permissions, can_approve_pull_request_reviews) {
        let name = "Workflows Default Permissions Check";
        let pass = false;
        let data = {};
        if (workflows_permissions && can_approve_pull_request_reviews) {
            pass = true;
            data = {
                workflows_permissions: true,
                can_approve_pull_request_reviews: true,
            };
        }
        else {
            data = { workflows_permissions, can_approve_pull_request_reviews };
        }
        return { name, pass, data };
    }
    createWorkflowsAccessPermissionsResult(access_permissions, error) {
        let name = "Workflows Access Permissions Check";
        let pass = false;
        let data = {};
        if (access_permissions) {
            pass = true;
            data = { access_permissions: true };
        }
        else {
            data = { access_permissions, error };
        }
        return { name, pass, data };
    }
}
exports.WorkflowsChecks = WorkflowsChecks;
