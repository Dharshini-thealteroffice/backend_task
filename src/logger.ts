import { createLogger, format, transports, Logger } from "winston";

const { combine, timestamp, json, colorize, printf } = format;

const consoleLogFormat = printf(({ level, message }) => {
  return `${level}: ${message}`;
});

const logger: Logger = createLogger({
  level: "info",
  format: combine(colorize(), timestamp(), json()),
  transports: [
    new transports.Console({
      format: combine(colorize(), consoleLogFormat),
    }),
    new transports.File({ filename: "app.log" }),
  ],
});

export default logger;
