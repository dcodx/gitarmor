# Enhanced CLI Output Documentation

## Overview

GitArmor now features an enhanced CLI output that provides better visibility into security gaps and suggested configurations. The new output format includes:

- Color-coded results (green for PASSED, red for FAILED, yellow for SKIPPED)
- Direct links to GitHub security documentation
- Threat model references for failed checks
- Links to SLSA.dev threat model
- Links to MS DevOps Threat Matrix

## Changes Made

### 1. Check Metadata System (`src/utils/checkMetadata.ts`)

Created a comprehensive metadata mapping system that links each check type to:
- **GitHub Documentation**: Official GitHub docs for best practices
- **Threat Model Section**: Reference to specific threats in `repository.threats.md` or `organization.threats.md`
- **SLSA.dev Threats**: Links to SLSA (Supply-chain Levels for Software Artifacts) threat model
- **MS DevOps Threat Matrix**: Links to Microsoft's DevOps security threat matrix

#### Repository Checks Metadata
- Branch Protection
- Branch Protection - Pull Request Settings
- Files Exist Check
- Files Disallow Check
- GHAS Checks
- Actions Check
- Workflows Default Permissions Check
- Workflows Access Permissions Check
- Runners Check
- WebHooks Check
- Admins Check

#### Organization Checks Metadata
- Members Privileges Check
- Org GHAS Checks
- Org Authentication Checks
- Org Custom Roles Checks
- Org Actions Checks

### 2. Output Formatter (`src/utils/outputFormatter.ts`)

Created formatting utilities that:
- Use chalk for colored terminal output
- Display check results with clear PASSED/FAILED/SKIPPED status
- Show GitHub documentation links for all checks
- Display threat model references for failed checks only
- Include SLSA.dev and MS DevOps Threat Matrix links for failed checks
- Format JSON data with proper indentation

### 3. Updated Evaluators

**RepoPolicyEvaluator** (`src/evaluators/RepoPolicyEvaluator.ts`):
- Now uses `printEnhancedCheckResult()` instead of basic logger output
- Displays repository-specific metadata

**OrgPolicyEvaluator** (`src/evaluators/OrgPolicyEvaluator.ts`):
- Now uses `printEnhancedCheckResult()` instead of basic logger output
- Displays organization-specific metadata

### 4. README Updates

Updated the output section to highlight the enhanced formatting features.

## Output Example

### Before (Old Format)
```
------------------------------------------------------------------------
Repository policy results - dcodx/gitarmor:
------------------------------------------------------------------------
[❌] Check: Files Disallow Check - Pass: false 
{"foundDisallowedFiles":[".env","config.xml"],"gitignoreExists":true,"missingInGitignore":[".env"]}
```

### After (New Format)
```
══════════════════════════════════════════════════════════════════════════════
Repository Policy Results - dcodx/gitarmor
══════════════════════════════════════════════════════════════════════════════

❌ FAILED - Files Disallow Check
  📘 GitHub Docs: https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning
  ⚠️  Threat Model: See "Sensitive files committed to the repository" in repository.threats.md
  🔗 SLSA.dev Threats:
     - https://slsa.dev/spec/v1.0/threats#e-compromise-source-repo
  🔗 MS DevOps Threat Matrix:
     - https://www.microsoft.com/en-us/security/blog/2023/04/06/devops-threat-matrix/
  Data: {
    "foundDisallowedFiles": [".env", "config.xml"],
    "gitignoreExists": true,
    "missingInGitignore": [".env"]
  }
```

## Benefits

1. **Better Visibility**: Clear visual distinction between passed and failed checks
2. **Actionable Guidance**: Direct links to official documentation for remediation
3. **Threat Context**: Understanding the security implications of failed checks
4. **Compliance Mapping**: Links to industry-standard security frameworks (SLSA, DevOps Threat Matrix)
5. **Improved UX**: More professional and user-friendly output

## Future Enhancements

Potential improvements could include:
- Progress bars during check execution
- Summary statistics at the end
- Grouped output by severity level
- Export to different formats (HTML, PDF)
- Interactive mode for drill-down into specific checks
