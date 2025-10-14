
# Organization Threat Model

In this section we define the threats that could affect the organization security posture, and define the controls that can be used to mitigate them. We also show how to configure these controls in the GitArmor policy. Each threat is linked to the SLSA.dev threat model and the MS DevOps threat matrix.

## Threats

### Unauthorized access to the organization repositories
An unauthorized actor could gain access to the organization repositories and exfiltrate sensitive data or inject malicious code.

#### Security controls

- Enforce SSO for all members of the organization
- Enforce 2FA for all members of the organization
- Restrict access to the organization to specific IP addresses (if possible)
- Use organization teams to manage access to repositories
- Use custom roles to limit permissions of users and teams

#### Gitarmor policy configuration
```yml
custom_roles:
  - name: "Security Team"
    base_role: "read" # read, triage, write, maintain
    permissions:
      - "delete_alerts_code_scanning"

# Priviliges 
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
  # admin_deletion_transfer: true
  # admin_issue_deletion: true
  # members_team_creation: true
  # dependency_graph_access: true


# Authentication
authentication:
  mfa_required: true

```


#### MS DevOps threat matrix
- [2. Initial access](https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/)
    - Compromise user account
    - SCM authentication




