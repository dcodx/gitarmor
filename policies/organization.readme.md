# Organization policy guide 


This policy checks the configuration of an organization to ensure that it is compliant with the organization's security requirements. It is recommended to run this policy on a regular basis to ensure that the organization's security posture is maintained. 

## Custom roles 

Custom roles allow you to define specific permissions for users and teams within the organization. The policy will check whether only the custom roles specified are used in the organization, with the right permissions and base role. [Github](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization)


```yml
custom_roles:
  - name: "Security Team"
    base_role: "read" # read, triage, write, maintain
    permissions:
      - "delete_alerts_code_scanning"
```
- `name`: the name of the custom role.
- `base_role`: the base role for the custom role. The base role can be one of the following:
  - `read`: read-only access.
  - `triage`: access to triage issues and pull requests. No write access
  - `write`: write access to the repository.Recommended for contributors who actively push to your project
  - `maintain`: manage the repository without access to sensitive or destructive actions.
- `permissions`: the permissions for the custom role can be one of the following:
    - `add_assignee`
    - `add_label`
    - `bypass_branch_protection`
    - `close_discussion`
    - `close_issue`
    - `close_pull_request`
    - `convert_issues_to_discussions`
    - `create_discussion_category`
    - `create_solo_merge_queue_entry`
    - `create_tag`
    - `delete_alerts_code_scanning`
    - `delete_discussion`
    - `delete_discussion_comment`
    - `delete_issue`
    - `delete_tag`
    - `edit_category_on_discussion`
    - `edit_discussion_category`
    - `edit_discussion_comment`
    - `edit_repo_custom_properties_values`
    - `edit_repo_metadata`
    - `edit_repo_protections`
    - `jump_merge_queue`
    - `manage_deploy_keys`
    - `manage_settings_merge_types`
    - `manage_settings_pages`
    - `manage_settings_projects`
    - `manage_settings_wiki`
    - `manage_webhooks`
    - `mark_as_duplicate`
    - `push_protected_branch`
    - `read_code_scanning`
    - `reopen_discussion`
    - `reopen_issue`
    - `reopen_pull_request`
    - `request_pr_review`
    - `resolve_dependabot_alerts`
    - `resolve_secret_scanning_alerts`
    - `set_interaction_limits`
    - `set_milestone`
    - `set_social_preview`
    - `toggle_discussion_answer`
    - `toggle_discussion_comment_minimize`
    - `view_dependabot_alerts`
    - `view_secret_scanning_alerts`
    - `write_code_scanning`
       
      
## Privileges 

This policy checks the privileges of the organization members to ensure that they have the appropriate access levels. It is recommended to review and update the privileges of the organization members regularly to ensure that they have the necessary access to the organization's resources. [Github](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization)

```yml
member_privileges:
  base_permission: "read" # no-permission, read, write, admin
  repository_creation: # all, internal, private, public
    - "internal"
    - "private" 
  repository_forking: true 
  pages_creation: # public, private
    - "public"
  # outside_collaborators: true
  # repository_comments: true
  # repository_discussions: true
  # project_base_permission: "read" # no-access, read, write, admin
  # admin_visilibilty_change: true
  # admin_deletaion_transfer: true
  # admin_issue_deletion: true
  # members_team_creation: true
  # dependency_graph_access: true
```

  - `base_permission`: the base permission level for the organization members. The base permission can be one of the following:
    - `no-permission`: no access to the organization.
    - `read`: read-only access to the organization.
    - `write`: write access to the organization.
    - `admin`: administrative access to the organization.

  - `repository_creation`: the types of repositories that organization members can create. The options are:
    - `all`: all types of repositories.
    - `internal`: internal repositories.
    - `private`: private repositories.
    - `public`: public repositories.

  - `repository_forking`: whether organization members can fork repositories.
  - `pages_creation`: the visibility of the GitHub Pages site that organization members can create. The options are:
    - `public`: public GitHub Pages site.
    - `private`: private GitHub Pages site.


## Authentication

This policy checks whether Multi-Factor authentication is enforced for the organization members to ensure that the organization's resources are protected from unauthorized access. It is recommended to enable Multi-Factor authentication for all organization members to enhance the security of the organization. [Github](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-two-factor-authentication-for-your-organization/requiring-two-factor-authentication-in-your-organization)


```yml 
authentication:
  mfa_required: true
```

- `mfa_required`: whether Multi-Factor authentication is required for the organization members. The options are:
  - `true`: Multi-Factor authentication is required.
  - `false`: Multi-Factor authentication is not required.


## Actions

This policy checks the GitHub Actions permissions for the organization to ensure that actions usage is properly controlled. [GitHub](https://docs.github.com/en/rest/actions/permissions?apiVersion=2022-11-28#get-github-actions-permissions-for-an-organization)

```yml
actions:
  enabled_repositories: all # all, none, selected
  allowed_actions: all # all, local_only, selected
  sha_pinning_required: true
```

- `enabled_repositories` (**optional**): specifies which repositories in the organization can use GitHub Actions. The options are:
  - `all`: all repositories can use GitHub Actions.
  - `none`: no repositories can use GitHub Actions.
  - `selected`: only selected repositories can use GitHub Actions.

- `allowed_actions` (**optional**): specifies which actions and reusable workflows can be run. The options are:
  - `all`: any action or reusable workflow can be used.
  - `local_only`: only actions and reusable workflows defined in the organization can be used.
  - `selected`: only selected actions and reusable workflows can be used (additional configuration required).

- `sha_pinning_required` (**optional**): if set to `true`, SHA pinning is required for actions in workflows. When enabled, actions must be referenced by their full commit SHA rather than by tag or branch. This improves security by ensuring that the exact version of an action is used and preventing potential supply chain attacks.


## GHAS (Github Advanced Security)

This policy checks whether GHAS is enabled for the organization to ensure that the organization's repositories are protected from security vulnerabilities. [Github](https://docs.github.com/en/code-security/secure-coding/about-github-advanced-security)

```yml
# Advanced Security
advanced_security:
  automatic_dependency_graph: true
  automatic_dependabot_alerts: true
  automatic_dependabot_security_updates: true
  automatic_ghas_enablement: true
  automatic_secret_scanning: true
  automatic_push_protection: true
  automatic_secret_scanning_validity_check: true
  # automatic_codeql_extended: true
  # automatic_codeql_autofix: true
  security_manager_teams:
    - "security_team" # slug
```

- `automatic_dependency_graph`: whether the dependency graph is enabled for the organization's repositories.
- `automatic_dependabot_alerts`: whether Dependabot alerts are enabled for the organization's repositories.
- `automatic_dependabot_security_updates`: whether Dependabot security updates are enabled for new repositories.
- `automatic_ghas_enablement`: whether GHAS is enabled for the new repositories.
- `automatic_secret_scanning`: whether secret scanning is enabled for new repositories.
- `security_manager_teams`: the teams that have access to the security features. The teams are specified by their slug. 

