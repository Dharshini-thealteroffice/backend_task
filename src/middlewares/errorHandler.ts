import { Request, Response } from "express";
import logger from "../logger";

class CustomError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

const errorHandler = (err: CustomError, req: Request, res: Response) => {
    logger.error(`Error: ${err.message}`);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        error: message,
    });
};

export { errorHandler, CustomError };