import winston from "winston";
import dotenv from "dotenv";
dotenv.config();

const loggerLevel = process.env.DEBUG === "true" ? "debug" : "info";

export const logger = winston.createLogger({
  level: loggerLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.cli(),
    }),
  ],
});
