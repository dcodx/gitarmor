type Inputs = {
  repo?: string;
  org?: string;
  token?: string;
  level?: string;
  policy_dir?: string;
  debug?: string;
};

export interface Issue {
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels: string[];
}

export interface Repository {
  name: string;
  owner: string;
}

export interface Organization {
  name: string;
  data: any;
}

export interface DependancyAlert {}

interface DismissalRestrictions {
  users: string[];
  teams: string[];
  apps: string[];
}

interface RequiredPullRequestReviews {
  dismiss_stale_reviews: boolean;
  require_code_owner_reviews: boolean;
  require_last_push_approval: boolean;
  required_approving_review_count: boolean;
  dismissal_restrictions: DismissalRestrictions;
}

interface RequiredStatusChecks {
  strict: boolean;
  contexts: string[];
}

interface ProtectedBranch {
  name: string;
  required_pull_request_reviews?: RequiredPullRequestReviews;
  required_status_checks?: RequiredStatusChecks;
  required_signatures?: boolean;
  enforce_admins?: boolean;
  required_linear_history?: boolean;
  allow_force_pushes?: boolean;
  allow_deletions?: boolean;
  block_creations?: boolean;
  required_conversation_resolution?: boolean;
  lock_branch?: boolean;
  allow_fork_syncing?: boolean;
}

interface AdvancedSecurity {
  ghas: boolean;
  secret_scanning: boolean;
  secret_scanning_push_protection: boolean;
  secret_scanning_validity_check: boolean;
  dependabot_alerts: boolean;
  dependabot_security_updates: boolean;
  dependabot_version_updates: boolean;
  code_scanning: boolean;
}

interface AllowedActions {
  permission: string;
  selected: {
    github_owned_allowed: boolean;
    verified_allowed: boolean;
    patterns_allowed: string[];
  };
}

interface Workflows {
  permission: string;
  approve_pull_requests: boolean;
  access_level: string;
}

interface Runners {
  self_hosted_allowed: boolean;
  self_hosted_allowed_os?: string[];
  self_hosted_allowed_labels?: string[];
  self_hosted_allowed_groups?: string[];
}

interface WebHook {
  id: number;
  active: boolean;
  events: string[];
  config: {
    url: string;
    content_type: string;
    insecure_ssl: string;
  };
}

interface WebHookConfig {
  content_type: string;
  insecure_ssl: number;
  secret: string;
  url: string;
}

interface RepoPolicy {
  protected_branches: ProtectedBranch[];
  file_exists: string[];
  file_disallow: string[];
  advanced_security: AdvancedSecurity;
  allowed_actions: AllowedActions;
  workflows: Workflows;
  runners: Runners;
  webhooks: WebHook;
}

// Org Policy
interface CustomRole {
  name: string;
  base_role: string;
  permissions: string[];
}

interface MemberPrivileges {
  base_permission: string;
  repository_creation: string[];
  repository_forking: boolean;
  outside_collaborators: boolean;
  repository_comments: boolean;
  repository_discussions: boolean;
  project_base_permission: string;
  pages_creation: string[];
  admin_visibility_change: boolean;
  admin_deletion_transfer: boolean;
  admin_issue_deletion: boolean;
  members_team_creation: boolean;
  dependency_graph_access: boolean;
}

interface Authentication {
  mfa_required: boolean;
}

interface AdvancedSecurity {
  automatic_dependency_graph: boolean;
  automatic_dependabot_alerts: boolean;
  automatic_dependabot_security_updates: boolean;
  automatic_ghas_enablement: boolean;
  automatic_secret_scanning: boolean;
  automatic_push_protection: boolean;
  automatic_secret_scanning_validity_check: boolean;
  automatic_codeql_extended: boolean;
  automatic_codeql_autofix: boolean;
  security_manager_teams: string[];
}

interface OrgPolicy {
  custom_roles: CustomRole[];
  member_privileges: MemberPrivileges;
  authentication: Authentication;
  advanced_security: AdvancedSecurity;
}

// Generic Check Result
interface CheckResult {
  name: string;
  pass: boolean;
  data: any;
}

interface Policy {
  org?: OrgPolicy; // replace with your OrganizationPolicy interface
  repo?: RepoPolicy; // replace with your RepositoryPolicy interface
}

// REST API Responses
interface CustomRole {
  id: number;
  name: string;
  description: string;
  base_role: string;
  permissions: string[];
  organization: Organization;
  created_at: string;
  updated_at: string;
}

interface CustomRepositoryRoles {
  total_count: number;
  custom_roles: CustomRole[];
}
