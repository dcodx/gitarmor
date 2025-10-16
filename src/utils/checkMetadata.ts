/**
 * Metadata for each check type including documentation links and threat model references
 */

export interface CheckMetadata {
  githubDocs?: string;
  threatModelSection?: string;
  slsaThreats?: string[];
  msDevOpsThreats?: string[];
}

export interface CheckMetadataMap {
  [checkName: string]: CheckMetadata;
}

/**
 * Repository-level check metadata
 */
export const repositoryCheckMetadata: CheckMetadataMap = {
  "Branch Protection": {
    githubDocs:
      "https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches",
    threatModelSection:
      "Push of malicious code in the repository on the default branch",
    slsaThreats: [
      "https://slsa.dev/spec/v1.0/threats-overview#a-submit-unauthorized-change",
    ],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "Branch Protection - Pull Request Settings": {
    githubDocs:
      "https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-pull-request-reviews-before-merging",
    threatModelSection:
      "Push of malicious code in the repository on the default branch",
    slsaThreats: [
      "https://slsa.dev/spec/v1.0/threats-overview#a-submit-unauthorized-change",
    ],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "Files Exist Check": {
    githubDocs:
      "https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file",
    threatModelSection: undefined,
    slsaThreats: [],
    msDevOpsThreats: [],
  },
  "Files Disallow Check": {
    githubDocs:
      "https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning",
    threatModelSection: "Sensitive files committed to the repository",
    slsaThreats: [
      "https://slsa.dev/spec/v1.0/threats#e-compromise-source-repo",
    ],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "GHAS Checks": {
    githubDocs:
      "https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security",
    threatModelSection: "Malicious code injected in the repository",
    slsaThreats: [
      "https://slsa.dev/spec/v1.0/threats-overview#d-use-compromised-dependency",
    ],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "Actions Check": {
    githubDocs:
      "https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions",
    threatModelSection:
      "Malicious actions in workflows configuration could be executed to compromise the supply chain",
    slsaThreats: [
      "https://slsa.dev/spec/v1.0/threats#c-build-from-modified-source",
    ],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "Workflows Default Permissions Check": {
    githubDocs:
      "https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-default-permissions",
    threatModelSection:
      "Malicious code execution in self-hosted runners (public repositories)",
    slsaThreats: [
      "https://slsa.dev/spec/v1.0/threats#c-build-from-modified-source",
    ],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "Workflows Access Permissions Check": {
    githubDocs:
      "https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-default-permissions",
    threatModelSection:
      "Malicious code execution in self-hosted runners (public repositories)",
    slsaThreats: [
      "https://slsa.dev/spec/v1.0/threats#c-build-from-modified-source",
    ],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "Runners Check": {
    githubDocs:
      "https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners",
    threatModelSection:
      "Malicious code execution in self-hosted runners (public repositories)",
    slsaThreats: [
      "https://slsa.dev/spec/v1.0/threats#e-compromise-build-process",
    ],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "WebHooks Check": {
    githubDocs:
      "https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks",
    threatModelSection:
      "Webhooks could be used as initial access into the organization's network",
    slsaThreats: [],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "Admins Check": {
    githubDocs:
      "https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization",
    threatModelSection: undefined,
    slsaThreats: [],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
};

/**
 * Organization-level check metadata
 */
export const organizationCheckMetadata: CheckMetadataMap = {
  "Members Privileges Check": {
    githubDocs:
      "https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization",
    threatModelSection: "Unauthorized access to the organization repositories",
    slsaThreats: [],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "Org GHAS Checks": {
    githubDocs:
      "https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security",
    threatModelSection: undefined,
    slsaThreats: [],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "Org Authentication Checks": {
    githubDocs:
      "https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-two-factor-authentication-for-your-organization/requiring-two-factor-authentication-in-your-organization",
    threatModelSection: "Unauthorized access to the organization repositories",
    slsaThreats: [],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "Org Custom Roles Checks": {
    githubDocs:
      "https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-peoples-access-to-your-organization-with-roles/managing-custom-repository-roles-for-an-organization",
    threatModelSection: undefined,
    slsaThreats: [],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
  "Org Actions Checks": {
    githubDocs:
      "https://docs.github.com/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization",
    threatModelSection: undefined,
    slsaThreats: [],
    msDevOpsThreats: [
      "https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/",
    ],
  },
};

/**
 * Get metadata for a check by name
 */
export function getCheckMetadata(
  checkName: string,
  isOrgCheck: boolean = false,
): CheckMetadata | undefined {
  const metadataMap = isOrgCheck
    ? organizationCheckMetadata
    : repositoryCheckMetadata;
  return metadataMap[checkName];
}
