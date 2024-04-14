import { CheckResult, Repository } from "../../types/common/main";
import { getWebHooks, getWebHookConfig } from "../../github/WebHooks";
import { logger } from "../../utils/Logger";

export class WebHooksChecks {
  private policy: any;
  private repository: Repository;

  constructor(policy: any, repository: Repository) {
    this.policy = policy;
    this.repository = repository;
  }

  // check whether the repository has self hosted runners enabled
  async checkWebHooks(): Promise<any> {
    const webhooks = await getWebHooks(
      this.repository.owner,
      this.repository.name,
    );

    console.log(webhooks);
    // for each webhook in webhooks extract the domain and check if it is in the allowed list in the policy, if not return false

    const allowedDomains = this.policy.webhooks.allowed_domains;
    const notAllowedDomains = [];
    webhooks.forEach((webhook) => {
      const domain = webhook.config.url.split("/")[2];
      if (!allowedDomains.includes(domain)) {
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

    const allowedEvents = this.policy.webhooks.allowed_events;
    const notAllowedEvents = [];
    webhooks.forEach((webhook) => {
      webhook.events.forEach((event) => {
        if (!allowedEvents.includes(event)) {
          notAllowedEvents.push(webhook);
        }
      });
    });

    //for each webhook use the getWebHookConfig function to get the config of the webhook and check if the secret is set, if not return false

    const notAllowedSecret = [];
    // if the policy mandatory_secret is set to true check that the secret is set for each webhook

    if (this.policy.webhooks.mandatory_secret) {
      const promises = webhooks.map((webhook) =>
        getWebHookConfig(
          this.repository.owner,
          this.repository.name,
          webhook.id,
        ).then((config) => {
          if (!config.secret) {
            notAllowedSecret.push(webhook);
          }
        }),
      );

      await Promise.all(promises);
    }

    return this.createResult(
      webhooks,
      notAllowedDomains,
      insecureSSL,
      notAllowedEvents,
      notAllowedSecret,
    );
  }

  private createResult(
    webhooks: any,
    not_allowed_domains: any,
    insecure_ssl: any,
    not_allowed_events: any,
    not_allowed_secret: any,
  ): CheckResult {
    let name = "WebHooks Check";
    let pass = false;
    let data = {};
    if (
      not_allowed_domains.length === 0 &&
      insecure_ssl.length === 0 &&
      not_allowed_events.length === 0 &&
      not_allowed_secret.length === 0
    ) {
      pass = true;
      data = { webhooks: webhooks };
    }
    if (not_allowed_domains.length > 0) {
      pass = false;

      //for each webhook in not_allowed_domains, extract the url and the name of the webhook and add it to the data object
      not_allowed_domains.forEach((webhook) => {
        data[webhook.name] = { not_allowed_domains: webhook.config.url };
      });
    }
    if (insecure_ssl.length > 0) {
      pass = false;

      //for each webhook in insecure_ssl, extract the url and the name of the webhook and add it to the data object
      insecure_ssl.forEach((webhook) => {
        data[webhook.name] = {
          ...data[webhook.name],
          allow_insecure_ssl: true,
        };
      });
    }
    if (not_allowed_events.length > 0) {
      pass = false;
      //for each webhook in not_allowed_events, extract the url, the name and the events of the webhook and add it to the data object
      not_allowed_events.forEach((webhook) => {
        data[webhook.name] = {
          ...data[webhook.name],
          not_allowed_events: webhook.events,
        };
      });
    }

    if (not_allowed_secret.length > 0) {
      pass = false;
      //for each webhook in not_allowed_secret, extract the url, the name and the secret of the webhook and add it to the data object
      not_allowed_secret.forEach((webhook) => {
        data[webhook.name] = { ...data[webhook.name], mandatory_secret: false };
      });
    }

    return { name, pass, data };
  }
}
