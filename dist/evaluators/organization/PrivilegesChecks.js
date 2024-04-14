"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivilegesChecks = void 0;
class PrivilegesChecks {
    policy;
    organization;
    constructor(organization, policy) {
        this.policy = policy;
        this.organization = organization;
    }
    async checkPrivileges() {
        const orgData = this.organization.data; //this is from the data we get from the GitHub API in org.data
        const requiredPermissions = this.policy.member_privileges; //this is from the policy loaded in OrgPolicy
        // Extract only the properties used for comparison
        const orgMemberPrivileges = {
            default_repository_permission: orgData.default_repository_permission,
            members_can_create_repositories: orgData.members_can_create_repositories,
            members_allowed_repository_creation_type: orgData.members_allowed_repository_creation_type,
            members_can_create_private_repositories: orgData.members_can_create_public_repositories,
            members_can_create_internal_repositories: orgData.members_can_create_internal_repositories,
            members_can_create_public_repositories: orgData.members_can_create_public_repositories,
            members_can_fork_private_repositories: orgData.members_can_fork_private_repositories,
            members_can_create_public_pages: orgData.members_can_create_public_pages,
            members_can_create_private_pages: orgData.members_can_create_private_pages,
            members_can_create_pages: orgData.members_members_can_create_pages,
        };
        // Check if the organization has the required permissions by comparing the values
        const hasRequiredPermissions = 
        // base permission
        orgMemberPrivileges.default_repository_permission ===
            requiredPermissions.base_permission &&
            // repository creation
            orgMemberPrivileges.members_can_create_repositories === true &&
            orgMemberPrivileges.members_allowed_repository_creation_type ===
                requiredPermissions.repository_creation &&
            // repository forking
            orgMemberPrivileges.members_can_fork_private_repositories ===
                requiredPermissions.repository_forking &&
            // pages creation
            orgMemberPrivileges.members_can_create_pages === true &&
            orgMemberPrivileges.members_can_create_public_pages ===
                (requiredPermissions.pages_creation.includes("public") &&
                    orgMemberPrivileges.members_can_create_private_pages ===
                        requiredPermissions.pages_creation.includes("private"));
        return this.createResult(hasRequiredPermissions, orgMemberPrivileges, requiredPermissions);
    }
    createResult(hasRequiredPermissions, orgMemberPrivileges, requiredPermissions) {
        let name = "Members Privileges Check";
        let pass = hasRequiredPermissions;
        let data = {
            orgMemberPrivileges,
            requiredPermissions,
        };
        return { name, pass, data };
    }
}
exports.PrivilegesChecks = PrivilegesChecks;
