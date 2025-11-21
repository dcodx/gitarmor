# Repository policy guide 
This policy checks the configuration of a repository to ensure that it is compliant with the repositories security requirements defined in an organization.

## Branch protection 
Branch protection is a way to prevent changes from being made to a branch, unless certain conditions are met. The policy will check whether the security settings specified are applied to the repository.

[GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)


```yml
protected_branches: 
  - name: main
    required_pull_request_reviews: 
      dismiss_stale_reviews: false
      require_code_owner_reviews: true
      require_last_push_approval: true
      required_approving_review_count: true
      dismissal_restrictions: 
        users: 
          - username
        teams:
          - team_slug
        apps:
          - app_slug
    required_status_checks: 
      strict: true
      contexts: 
        - context1
        - context2
    required_signatures: true
    enforce_admins: true
    required_linear_history: true
    allow_force_pushes: false
    allow_deletions: false
    block_creations: true
    required_conversation_resolution: true
    lock_branch: false
    allow_fork_syncing: true
```
`protected_branches` is a list of branches that must have protection enabled. Each branch can have the following settings:

- `name` (**mandatory**): the name of the branch.
- `required_pull_request_reviews`: settings for pull request reviews.
  - `dismiss_stale_reviews`: if set to `true`, pull request reviews that have not been updated for more than 6 months are dismissed.
  - `require_code_owner_reviews`: if set to `true`, code owners must approve pull requests.
  - `require_last_push_approval`: if set to `true`, the author of the last commit must approve the pull request.
  - `required_approving_review_count`: if set to `true`, a minimum number of approving reviews is required.
  - `dismissal_restrictions`: restrictions for dismissing reviews.
    - `users`: a list of users that can dismiss reviews.
    - `teams`: a list of teams that can dismiss reviews.
    - `apps`: a list of apps that can dismiss reviews.

- `required_signatures`: if set to `true`, commits must be signed.
- `enforce_admins`: if set to `true`, repository administrators can merge pull requests.
- `required_linear_history`: if set to `true`, the branch must have a linear history.
- `allow_force_pushes`: if set to `true`, force pushes are allowed. 
- `allow_deletions`: if set to `true`, branch deletions are allowed.
- `block_creations`: if set to `true`, branch creations are blocked.
- `required_conversation_resolution`: if set to `true`, conversations must be resolved before merging.
- `lock_branch`: if set to `true`, the branch is locked.
- `allow_fork_syncing`: if set to `true`, the branch can be synced with the upstream repository.


## Tag Protection

Tag protection is a way to protect important version tags and releases from unauthorized modifications or deletions. The policy checks whether the tag protection settings specified are applied to the repository using GitHub repository rulesets.

[GitHub Repository Rulesets for Tags](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)

```yml
tags:
  enforcement: active           # disabled | active | evaluate
  target: tag                   # fixed for tag rules so we can also not specify it here but fix it in code

  scope:
    include:
      - "v*"                    # e.g., protect all version tags
      # - "~ALL"                # special token: all tags
    exclude: []                 # patterns to exclude, e.g., ["v*-beta*", "v*-alpha*"]

  operations:                   # who can perform actions on matching tags
    create: restricted          # allowed | restricted (restricted = bypass-only)
    update: restricted
    delete: restricted

  naming:                       # optional: constrain tag names
    enabled: true
    operator: regex             # starts_with | ends_with | contains | regex
    pattern: "^v\\d+\\.\\d+\\.\\d+(-[0-9A-Za-z.-]+)?$"
    negate: false               # true = pattern disallowed

  bypass:                       # actors allowed to bypass protections
    organization_admins: always # always | exempt
    teams:
      - id: 1234567             # example team id
        mode: always            # always | exempt
    integrations:
      - id: 987654              # GitHub App id
        mode: always
    repository_roles:
      - id: 3                   # e.g., Maintainer role id
        mode: always
    deploy_keys:
      allow: true               # DeployKeys can bypass when true
      mode: always
```

`tags` configuration has the following settings:

- `enforcement` (**mandatory**): the enforcement level for the tag ruleset.
  - `disabled`: the ruleset is disabled and not enforced.
  - `active`: the ruleset is actively enforced and will block non-compliant operations.
  - `evaluate`: the ruleset runs in evaluation mode (logs violations without blocking).

- `target` (**optional**): should always be `tag` for tag rulesets. This is typically fixed in code and doesn't need to be specified.

- `scope`: defines which tags are protected by the ruleset.
  - `include`: a list of tag patterns to protect. Supports wildcards (e.g., `v*` for all version tags) and the special token `~ALL` to protect all tags.
  - `exclude`: a list of tag patterns to exclude from protection (e.g., `["v*-beta*", "v*-alpha*"]` to exclude pre-release tags).

- `operations`: defines who can perform operations on protected tags.
  - `create`: controls tag creation. Set to `restricted` to allow only bypass actors to create tags, or `allowed` for unrestricted creation.
  - `update`: controls tag updates. Set to `restricted` to allow only bypass actors to update tags, or `allowed` for unrestricted updates.
  - `delete`: controls tag deletion. Set to `restricted` to allow only bypass actors to delete tags, or `allowed` for unrestricted deletion.

- `naming` (**optional**): constrains tag names using pattern matching.
  - `enabled`: set to `true` to enable naming constraints.
  - `operator`: the pattern matching operator to use.
    - `starts_with`: tag name must start with the pattern.
    - `ends_with`: tag name must end with the pattern.
    - `contains`: tag name must contain the pattern.
    - `regex`: tag name must match the regular expression pattern.
  - `pattern`: the pattern or regular expression to match against tag names. For semantic versioning, use: `"^v\\d+\\.\\d+\\.\\d+(-[0-9A-Za-z.-]+)?$"`.
  - `negate`: if set to `true`, the pattern is disallowed (inverts the match).

- `bypass` (**optional**): defines actors who can bypass tag protection rules.
  - `organization_admins`: bypass mode for organization administrators.
    - `always`: organization admins can always bypass the rules.
    - `exempt`: organization admins are not exempt and must follow the rules.
  - `teams`: a list of teams that can bypass the rules.
    - `id`: the team ID (numeric).
    - `mode`: `always` (can bypass) or `exempt` (cannot bypass).
  - `integrations`: a list of GitHub Apps that can bypass the rules.
    - `id`: the GitHub App ID (numeric).
    - `mode`: `always` (can bypass) or `exempt` (cannot bypass).
  - `repository_roles`: a list of repository roles that can bypass the rules.
    - `id`: the repository role ID (e.g., 3 for Maintainer).
    - `mode`: `always` (can bypass) or `exempt` (cannot bypass).
  - `deploy_keys`: configuration for deploy keys.
    - `allow`: set to `true` to allow deploy keys to bypass protections, `false` to deny.
    - `mode`: `always` (can bypass) or `exempt` (cannot bypass).

**Best Practice**: Use tag protection to secure release tags, enforce semantic versioning, and prevent accidental deletion or modification of important version markers.


## File Disallow

The `file_disallow` policy checks if sensitive files that should not be present in the repository are found. This helps prevent accidental commits of credentials, API keys, and other sensitive information.

[GitHub Gitignore Reference](https://github.com/github/gitignore)

```yml
file_disallow:
  - .env
  - .env.local
  - .env.production
  - .env.development
  - config.xml
  - credentials.json
  - secrets.yml
```

The policy will:
1. Check if any of the specified files exist in the repository
2. Verify if disallowed files are properly listed in `.gitignore`
3. Report which files are found and which ones are missing from `.gitignore`

`file_disallow` is a list of file paths (relative to repository root) that should not exist in the repository. Common examples include:

- `.env` and variants (`.env.local`, `.env.production`, etc.) - Environment variable files often containing credentials
- `config.xml`, `credentials.json` - Configuration files that may contain sensitive data
- `secrets.yml` - Secret management files
- Any other files that typically contain API tokens, passwords, or sensitive information

**Best Practice**: All files listed in `file_disallow` should also be added to `.gitignore` to prevent accidental commits.


## Actions 

### Permissions
The policy checks the actions permissions for the specified repository. 

```yml
actions:
  permission: local_only
  selected:
    github_owned_allowed: true
    verified_allowed: false
    patterns_allowed:
      - "veracode/*"
      - "dcodx/*"
  sha_pinning_required: true
```
    
`permission` can have the following values: 

- `none` : no actions are allowed.
- `local_only`: any action or reusable workflow defined in a repository within the organization can be used.
- `all`: any action or reusable workflow defined in any repository can be used.
- `selected`: only the actions or reusable workflows defined in the `selected` section can be used.

When `permission` is set to `selected`, the following options are available:

- `github_owned_allowed`: if set to `true`, actions or reusable workflows defined in a repository owned by GitHub can be used.
- `verified_allowed`: if set to `true`, actions or reusable workflows defined in a repository verified by GitHub can be used.
- `patterns_allowed` (**mandatory**): a list of patterns that can be used to only allow specific actions. The patterns in the policy must match the patterns in the GitHub settings to make the check successful.

When `permission` is set to `local_only`, `all` or `none`, the `selected` section is ignored.

`sha_pinning_required` (**optional**): if set to `true`, SHA pinning is required for actions in workflows. When enabled, actions must be referenced by their full commit SHA rather than by tag or branch. This improves security by ensuring that the exact version of an action is used and preventing potential supply chain attacks.

## GHAS (GitHub Advanced Security) 

The policy checks the GHAS settings for the specified repository. 

```yml
advanced_security:
  ghas: true
  secret_scanning: true
  secret_scanning_push_protection: true
  secret_scanning_validity_check: true
  dependabot_alerts: true
  dependabot_security_updates: true
  dependabot_version_updates: true
  code_scanning: true
```

All the checks are optional and can be set to `true` or `false`. 

- `ghas`: if set to `true`, GHAS is enabled for the repository.
- `secret_scanning`: if set to `true`, secret scanning is enabled for the repository.
- `secret_scanning_push_protection`: if set to `true`, secret scanning push protection is enabled for the repository.
- `secret_scanning_validity_check`: if set to `true`, secret scanning validity check is enabled for the repository.
- `dependabot_alerts`: if set to `true`, Dependabot alerts are enabled for the repository.
- `dependabot_security_updates`: if set to `true`, Dependabot security updates are enabled for the repository.
- `dependabot_version_updates`: if set to `true`, Dependabot version updates are enabled for the repository.
- `code_scanning`: if set to `true`, code scanning is enabled for the repository.


## Workflows

### Permissions
https://docs.github.com/en/rest/actions/permissions?apiVersion=2022-11-28#get-default-workflow-permissions-for-a-repository

Gets the default workflow permissions granted to the GITHUB_TOKEN when running workflows in a repository, as well as if GitHub Actions can submit approving pull request reviews. 

```yml
workflows:
  permission: read # read, write
  approve_pull_requests: true
  access_level: user # none, organization, enterprise, user
```

`permission` can have the following values:

- `read`: Workflows have read permissions in the repository for the contents and packages scopes only.
- `write`: Workflows have read and write permissions in the repository for all scopes.

`approve_pull_requests` can have be only set to `true` or `false`

`access_level` can have the following values:

- `none`: the access to the repo is only possible from workflows in this repository. 
- `organization`:  organization level access allows sharing across the organization.
- `user`: user level access allows sharing across user owned private repositories only.

## Runners

### Self-hosted runners 

The policy checks whether the repository has self-hosted runners defined, together with the OS used by the runners.
Security: https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners#self-hosted-runner-security

```yml
runners:
  self_hosted: false
  self_hosted_allowed_os:
  - linux
  - windows
  - macOS
```

- `self_hosted_allowed` can only be set to `true` or `false`. If false, the policy will fail if the repository has self-hosted runners defined.
- `self_hosted_allowed_os` is a list of allowed OS for the self-hosted runners. If the list is empty, the policy will not check the OS of the self-hosted runners.


## Webhooks

The policy checks the webhooks configuration for the specified repository. 

```yml
webhooks:
  allowed_domains:
    - github.com
  allow_insecure_ssl: false
  allowed_events:
    - pull
  mandatory_secret: false
```

- `allowed_domains`: a list of domains that can be used as webhooks.
- `allow_insecure_ssl`: if set to `true`, insecure SSL connections are allowed.
- `allowed_events`: a list of events that can trigger the webhook.
- `mandatory_secret`: if set to `true`, a secret must be set to authenticate the webhook.

## Admins

The policy validates that the repository admins match the specified list.

```yml
admins:
  - admin1
  - admin2
```

GitArmor will check that the admins specified in the policy are matching the admins of the repository. The check will:
- Identify any admins in the policy that are not repository admins (missing admins)
- Identify any repository admins that are not in the policy (extra admins)
- Pass only if all admins match exactly


