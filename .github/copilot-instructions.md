# GitArmor
GitArmor is a TypeScript Node.js project that functions as both a GitHub Action and CLI tool for security assessments of GitHub repositories and organizations. It transforms DevOps platform security policies into YAML policies as code and runs checks against GitHub environments.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Build
- Check Node.js version (requires v18+): `node --version`
- Install dependencies: `npm install` -- takes ~5 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Build the project: `npm run build` -- takes ~11 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
  - This runs: `npm run clean && tsc && ncc build ./src/main.ts -o dist --license licenses.txt`
  - Compiles TypeScript source in `src/` to JavaScript
  - Bundles everything into `dist/index.js` using ncc for GitHub Action distribution

### Code Quality and Formatting
- Check code formatting: `npm run prettier:check` -- takes ~1 second
- Fix code formatting: `npm run prettier:write` -- takes ~1 second
- Check security vulnerabilities: `npm audit` -- takes ~1 second
- **DO NOT run `npm audit fix`** -- it introduces TypeScript compilation errors due to dependency version conflicts

### Configuration and Setup
- Copy `.env.sample` to `.env` and configure:
  ```bash
  cp .env.sample .env
  ```
- Required environment variables in `.env`:
  - `TOKEN`: GitHub Personal Access Token with repo:admin and org:admin permissions
  - `LEVEL`: `repository_only`, `organization_only`, or `organization_and_repository`
  - `REPO`: Repository name (when using repository-level checks)
  - `ORG`: Organization name
  - `DEBUG`: `true` or `false`
  - `POLICY_DIR`: Path to policies directory (default: `./policies`)

### Running the Application
- CLI mode: `npm run start` -- builds and runs, takes ~11 seconds + runtime. NEVER CANCEL. Set timeout to 300+ seconds.
- Direct execution after build: `node ./dist/index.js`

## Validation

### Manual Testing Scenarios
ALWAYS test these scenarios after making changes:

1. **Build Validation**:
   ```bash
   npm install
   npm run build
   ```
   - Build should complete successfully in ~11 seconds
   - Should generate `dist/index.js` and `dist/licenses.txt`

2. **Code Quality Validation**:
   ```bash
   npm run prettier:check
   npm run prettier:write
   npm audit
   ```
   - Prettier should pass or auto-fix formatting issues
   - npm audit will show 4 moderate vulnerabilities (known issue, do not fix)

3. **CLI Functionality Test**:
   ```bash
   # Create test .env with fake token
   echo "TOKEN=fake_token_for_testing
   LEVEL=repository_only
   REPO=gitarmor
   ORG=dcodx
   DEBUG=true
   POLICY_DIR=./policies" > .env
   
   npm run start
   ```
   - Should start successfully, load policies, and fail with "Blocked by DNS monitoring proxy" or authentication error (expected with fake token)
   - Should show GitArmor banner and debug information

4. **Policy Loading Test**:
   - Verify `policies/repository.yml` and `policies/organization.yml` exist and are valid YAML
   - Application should load policies without errors during startup

### GitHub Action Testing
- The project includes example workflows in `.github/workflows/`:
  - `gitarmor-on-demand.yml` - Manual trigger workflow
  - `gitarmor-scheduled.yml` - Scheduled daily workflow
- Action defined in `action.yml` with Node 20 runtime
- Outputs: `check-results-json` and `check-results-text`

## Common Tasks

### Repository Structure
```
ls -la
.env.sample
.github/           # GitHub workflows and documentation
.gitignore
LICENSE
README.md
action.yml         # GitHub Action definition
dist/              # Built artifacts (created by npm run build)
package.json       # Dependencies and scripts
policies/          # YAML policy definitions
src/               # TypeScript source code
tsconfig.json      # TypeScript configuration
```

### Key Source Directories
```
ls -la src/
evaluators/        # Policy evaluation logic
github/           # GitHub API interaction
main.ts           # Application entry point  
reporting/        # Report generation
types/            # TypeScript type definitions
utils/            # Utility functions (logger, input parsing, etc.)
```

### Policy Files
```
ls -la policies/
organization.yml      # Organization-level security policies
organization.readme.md
organization.threats.md
repository.yml        # Repository-level security policies  
repository.readme.md
repository.threats.md
```

### Package.json Scripts
- `npm run test` -- Currently not implemented (exits with error)
- `npm run clean` -- Removes dist directory contents
- `npm run build` -- Full build: clean + compile + bundle
- `npm run prettier:write` -- Auto-fix code formatting
- `npm run prettier:check` -- Check code formatting
- `npm run start` -- Build and run CLI application

## Important Notes

### Critical Warnings
- **NEVER CANCEL** any build or test command. Set timeouts of 60+ seconds minimum.
- **DO NOT run `npm audit fix`** - it breaks the build due to dependency version conflicts.
- Always run `npm run prettier:write` before committing to ensure consistent formatting.
- The `.env` file contains sensitive tokens - it's already in `.gitignore`.

### Known Issues
- 4 moderate security vulnerabilities in dependencies (@octokit packages and undici)
- No test suite currently implemented
- TypeScript import paths are case-sensitive (use lowercase: `logger`, `input`)

### Working with GitHub API
- Requires valid GitHub token with appropriate permissions
- Tool makes extensive API calls - organization_and_repository level may hit rate limits
- Supports repository-only, organization-only, or both levels of analysis
- Generates reports in both JSON and Markdown formats (`output-report.json`, `output-report.md`)

### Development Tips
- Check `src/utils/input.ts` for understanding input parameter parsing
- Policy definitions in `policies/` directory control what security checks are performed
- Logger configuration in `src/utils/logger.ts` - set DEBUG=true for verbose output
- Main application logic in `src/main.ts` coordinates policy evaluation and reporting

### Check Result Data Contract (Consistency Rule)
All checks must return data in the same structured format to keep CLI and reports consistent:

- pass: boolean — overall pass/fail for the check
- name: string — descriptive check name
- data: object with the following shape
  - passed: string[] — identifiers that satisfied the policy (e.g., branch names)
  - failed: object — grouped failure buckets (domain-specific)
  - info: object — additional useful context not strictly part of pass/fail (domain-specific)

Notes:
- Keep keys stable (passed, failed, info) across all checks.
- Tailor the arrays/objects under failed and info to the domain of the check while preserving the top-level structure.