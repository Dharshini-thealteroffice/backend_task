import { createLogger, format, transports, Logger } from "winston";
import path from "path";
import fs from "fs";

const { combine, timestamp, json, printf } = format;

const logDir = path.join(__dirname, "../logs");

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger: Logger = createLogger({
    level: "info",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json()),

    transports: [
        new transports.Console({
            format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
        }),

        new transports.File({ 
            filename: path.join(logDir, "info.log"), 
            level: "info" 
        }),

        new transports.File({ 
            filename: path.join(logDir, "error.log"), 
            level: "error" 
        }),
    ],
});

export default logger;
