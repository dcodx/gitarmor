# Repository Threat Model


In this section we define the threats that could affect the repository, and define the controls that can be used to mitigate them. We also show how to configure these controls in the GitArmor policy. Each threat is linked to the SLSA.dev threat model and the MS DevOps threat matrix. 

## Threats

### Push of malicious code in the repository on the default branch
A malicious actor could push malicious code on the default branch of the repository

#### Security controls
- Require pull request reviews before merging on the default branch
- Require CODEOWNERS review before merging on the default branch
- Require signed commits on the default branch (for organizations)
- Require linear history on the default branch
- Restrict who can dismiss pull request reviews
- Restrict who can dismiss stale pull request reviews
- Do not allow force push to matching branches (default none)

#### Gitarmor policy configuration
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
          - dcodx
    required_signatures: true
    enforce_admins: true
    required_linear_history: true
    allow_force_pushes: false
    allow_deletions: false
    block_creations: true
```

#### SLSA.dev threats 
- [(A): Submit unauthorized change (to source repo)](https://slsa.dev/spec/v1.0/threats-overview)	
- (A)(B) Delete the code


#### MS DevOps threat matrix
- [3. Persistence](https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/)
  - Changes in repository
- [4. Privilege escalation](https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/)
  - Commit/push to protected branches
  - Endpoint compromise

### Malicious actions in workflows configuration could be executed to compromise the supply chain
A malicious actor could compromise an action used by the repository to execute malicious code, exfiltrate secrets or data and compromise the supply chain.

#### Security controls
- Restrict the actions that can be used in the repository
- Restrict the actions that can be used in the repository to GitHub owned actions
- Restrict the actions that can be used in the repository to a list of safe actions verified by security engineers and trusted developers
- Pin the version of the actions used in the repository to a specific hash

#### Gitarmor policy configuration
```yml
allowed_actions:
  use_pinning: true #not yet available
  permission: selected
  selected:
    github_owned_allowed: true
    verified_allowed: false
    patterns_allowed:
      - "trused_author/*"
      - "dcodx/*"
```
#### SLSA.dev threats
- [(C) Build from modified source](https://slsa.dev/spec/v1.0/threats)


#### MS DevOps threat matrix
- [1. Initial access](https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/)
  - CI/CD service authentication
- [2. Execution](https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/)
  - Poisoned pipeline execution (PPE)
  - DevOps resources compromise



### Malicious code execution in self-hosted runners (public repositories)
A malicious actor could execute code in a self-hosted runner, and use it to exfiltrate data from the runner, or to attack other systems in the network. 

#### Security controls
- Disable self-hosted runners for public repositories. Forks of your public repository can potentially run dangerous code on your self-hosted runner machine by creating a pull request that executes the code in a workflow.
- Make sure that workflows are set with read-only permissions, and that they cannot be modified,or approve pull requests.

#### Gitarmor policy configuration
```yml
runners:
  self_hosted_allowed: false
workflows:
  permission: read
  approve_pull_requests: false
  access_level: none
```
#### SLSA.dev threats
- [(C) Build from modified source](https://slsa.dev/spec/v1.0/threats)
  - Build from unofficial fork of code
- [(E) Compromise build process](https://slsa.dev/spec/v1.0/threats)
  - Forge values of the provenance (other than output digest)
  - Compromise other build



#### MS DevOps threat matrix
- [6. Lateral movement](https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/)
  - Compromise build artifacts
  - Spread to deployment resources


### Webhooks could be used as initial access into the organization’s network
If an organization has set up a webhook, it could potentially be exploited by an attacker as a gateway into the organization's network. By manipulating the SCM to initiate requests, the attacker could gain access to internal services that are not intended for public exposure or that are operating on outdated and susceptible software versions within the private network.

#### Security controls
- Restrict the domain/IP that can access the webhook (on your server)
- Use a secret to authenticate the webhook
- Subscribe to the minimum number of events required
- Use HTTPS and SSL verification

#### Gitarmor policy configuration
```yml
webhooks:
  allowed_domains:
    - github.com
  allow_insecure_ssl: false
  allowed_events:
    - pull
  mandatory_secret: true
```


#### MS DevOps threat matrix
- [1. Initial access](https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/)
  - Configured webhooks
  - Endpoint compromise


### Malicious or vulnerable dependencies in the repository

A malicious actor could exploit a malicious or vulnerable dependency in the repository, which could be used to compromise the application, exfiltrate data, or attack other systems in the network.

#### Security controls
- Use a dependency scanner to identify and remediate vulnerabilities in the dependencies

#### Gitarmor policy configuration
```yml
advanced_security:
  dependabot_alerts: true
  dependabot_security_updates: true
  dependabot_version_updates: true
```

#### SLSA.dev threats
- [(D) Use compromised dependency](https://slsa.dev/spec/v1.0/threats)


### Malicious code injected in the repository

A malicious actor could inject malicious code in the applications to gain persistence or access to production and internal servers. 

#### Security controls
- Use a static code analysis tool to identify and remediate vulnerabilities in the code
- Use a malware scanner to identify and remediate malicious code in the repository

#### Gitarmor policy configuration
```yml
advanced_security:
  code_scanning: true
  ghas: true
  secret_scanning: true
  secret_scanning_push_protection: true
  secret_scanning_validity_check: true
```

#### SLSA.dev threats
- [(D) Use compromised dependency](https://slsa.dev/spec/v1.0/threats-overview)
  - Use a compromised runtime dependency
