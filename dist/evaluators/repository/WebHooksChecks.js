"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebHooksChecks = void 0;
const WebHooks_1 = require("../../github/WebHooks");
class WebHooksChecks {
    policy;
    repository;
    constructor(policy, repository) {
        this.policy = policy;
        this.repository = repository;
    }
    // check whether the repository has self hosted runners enabled
    async checkWebHooks() {
        const webhooks = await (0, WebHooks_1.getWebHooks)(this.repository.owner, this.repository.name);
        // for each webhook in webhooks extract the domain and check if it is in the allowed list in the policy, if not return false
        const allowedDomains = this.policy.webhooks.allowed_domains || [];
        const notAllowedDomains = [];
        webhooks.forEach((webhook) => {
            const domain = webhook.config.url.split("/")[2];
            if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
                notAllowedDomains.push(webhook);
            }
        });
        // for each wehbhook in webhooks check that insecure_ssl is 0 if the policy (allow_insecure_ssl) is set to false, if not return false
        const allowInsecureSSL = this.policy.webhooks.allow_insecure_ssl;
        const insecureSSL = [];
        webhooks.forEach((webhook) => {
            if (allowInsecureSSL === false && webhook.config.insecure_ssl === "1") {
                insecureSSL.push(webhook);
            }
        });
        // for each webhook in webhooks check that events are in the allowed list in the policy, if not return false
        const allowedEvents = this.policy.webhooks.allowed_events || [];
        const notAllowedEvents = [];
        webhooks.forEach((webhook) => {
            const extraEvents = (webhook.events || []).filter((event) => allowedEvents.length > 0 && !allowedEvents.includes(event));
            if (extraEvents.length > 0) {
                notAllowedEvents.push({ webhook, extraEvents });
            }
        });
        //for each webhook use the getWebHookConfig function to get the config of the webhook and check if the secret is set, if not return false
        const notAllowedSecret = [];
        // if the policy mandatory_secret is set to true check that the secret is set for each webhook
        if (this.policy.webhooks.mandatory_secret) {
            const promises = webhooks.map((webhook) => (0, WebHooks_1.getWebHookConfig)(this.repository.owner, this.repository.name, webhook.id).then((config) => {
                if (!config.secret) {
                    notAllowedSecret.push(webhook);
                }
            }));
            await Promise.all(promises);
        }
        return this.createResult(webhooks, notAllowedDomains, insecureSSL, notAllowedEvents, notAllowedSecret);
    }
    createResult(webhooks, not_allowed_domains, insecure_ssl, not_allowed_events, not_allowed_secret) {
        const name = "WebHooks Check";
        const passed = [];
        const failed = {};
        const info = { total_webhooks: webhooks.length };
        if (not_allowed_domains.length === 0) {
            passed.push("allowed_domains");
        }
        else {
            not_allowed_domains.forEach((webhook) => {
                if (!failed[webhook.name]) {
                    failed[webhook.name] = {
                        id: webhook.id,
                        url: webhook.config.url,
                        checks_failed: [],
                    };
                }
                failed[webhook.name].not_allowed_domains = webhook.config.url;
                failed[webhook.name].checks_failed.push("allowed_domains");
            });
        }
        if (insecure_ssl.length === 0) {
            passed.push("allow_insecure_ssl");
        }
        else {
            insecure_ssl.forEach((webhook) => {
                if (!failed[webhook.name]) {
                    failed[webhook.name] = {
                        id: webhook.id,
                        url: webhook.config.url,
                        checks_failed: [],
                    };
                }
                failed[webhook.name].allow_insecure_ssl = true;
                failed[webhook.name].checks_failed.push("allow_insecure_ssl");
            });
        }
        if (not_allowed_events.length === 0) {
            passed.push("allowed_events");
        }
        else {
            not_allowed_events.forEach(({ webhook, extraEvents }) => {
                if (!failed[webhook.name]) {
                    failed[webhook.name] = {
                        id: webhook.id,
                        url: webhook.config.url,
                        checks_failed: [],
                    };
                }
                failed[webhook.name].not_allowed_events = extraEvents;
                failed[webhook.name].checks_failed.push("allowed_events");
            });
        }
        if (not_allowed_secret.length === 0) {
            passed.push("mandatory_secret");
        }
        else {
            not_allowed_secret.forEach((webhook) => {
                if (!failed[webhook.name]) {
                    failed[webhook.name] = {
                        id: webhook.id,
                        url: webhook.config.url,
                        checks_failed: [],
                    };
                }
                failed[webhook.name].mandatory_secret = false;
                failed[webhook.name].checks_failed.push("mandatory_secret");
            });
        }
        const pass = Object.keys(failed).length === 0;
        const data = { passed, failed, info };
        return { name, pass, data };
    }
}
exports.WebHooksChecks = WebHooksChecks;
