import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import * as dotenv from "dotenv";
import { logger } from "../utils/logger";
import { getInput } from "@actions/core";
dotenv.config();

export class GitArmorKit extends Octokit {
  constructor() {
    super({
      baseUrl: process.env.GITHUB_API_URL ?? "https://api.github.com",
      auth: getInput("token") || process.env.TOKEN,
      throttle: {
        onRateLimit: (retryAfter, options, octokit) => {
          octokit.log.warn(
            `Request quota exhausted for request ${options.method} ${options.url}`,
          );
          if (options.request.retryCount <= 2) {
            logger.debug(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          octokit.log.warn(
            `Secondary rate limit for request ${options.method} ${options.url}`,
          );
          if (options.request.retryCount <= 2) {
            logger.debug(
              `Secondary Limit - Retrying after ${retryAfter} seconds!`,
            );
            return true;
          }
        },
      },
    });
  }
}
