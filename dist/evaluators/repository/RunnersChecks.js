"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunnersChecks = void 0;
const Runners_1 = require("../../github/Runners");
class RunnersChecks {
    policy;
    repository;
    constructor(policy, repository) {
        this.policy = policy;
        this.repository = repository;
    }
    // check whether the repository has self hosted runners enabled
    async checkRunnersPermissions() {
        const runners = await (0, Runners_1.getRepoRunners)(this.repository.owner, this.repository.name);
        const runnersAllowed = this.policy.runners.self_hosted_allowed
            ? true
            : runners.total_count === 0;
        const runnersPolicySelfHostedOs = this.policy.runners.self_hosted_allowed_os;
        const notAllowedOs = [];
        //for each runner in runners check if the os is one of the allowed os in the policy, if not return false
        if (runnersPolicySelfHostedOs !== undefined &&
            Array.isArray(runnersPolicySelfHostedOs)) {
            runners.runners.forEach((runner) => {
                if (!runnersPolicySelfHostedOs.includes(runner.os)) {
                    notAllowedOs.push(runner);
                }
            });
        }
        return this.createResult(runnersAllowed, runners.total_count, notAllowedOs);
    }
    createResult(self_hosted_runners, self_hosted_runners_defined, self_hosted_runners_os_not_allowed) {
        let name = "Runners Check";
        let pass = false;
        let data = {};
        if (self_hosted_runners &&
            self_hosted_runners_os_not_allowed.length === 0) {
            pass = true;
            data = {
                self_hosted_runners_in_policy: self_hosted_runners,
                self_hosted_runners_defined,
            };
        }
        else {
            data = {
                self_hosted_runners_in_policy: self_hosted_runners,
                self_hosted_runners_defined,
                self_hosted_runners_os_not_allowed,
            };
        }
        return { name, pass, data };
    }
}
exports.RunnersChecks = RunnersChecks;
