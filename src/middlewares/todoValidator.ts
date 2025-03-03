import {Request, Response, NextFunction} from "express";
import { body, validationResult } from "express-validator";
import logger from "../logger";  

export const validateTodo = [
    body("content").notEmpty().withMessage("Content is required"),
    body("deadline").notEmpty().isISO8601().withMessage("Deadline must be a valid date"),
    body("status").notEmpty().isIn(["pending", "in-progress", "completed"]).withMessage("Invalid status"),
    body("priority").notEmpty().isIn(["low", "medium", "high"]).withMessage("Priority must be 'low', 'medium', or 'high'"),
    body("created_by").notEmpty().isInt().withMessage("Created_by must be an integer"),
    body("assigned_to").notEmpty().isInt().withMessage("Assigned_to must be an integer"), // Change this if it's supposed to be an email
];

export const validateUpdateTodo = [
    body("content").optional().notEmpty().withMessage("Content cannot be empty"),
    body("deadline").optional().isISO8601().withMessage("Deadline must be a valid date"),
    body("status").optional().isIn(["pending", "in-progress", "completed"]).withMessage("Invalid status"),
    body("priority").optional().isIn(["low", "medium", "high"]).withMessage("Priority must be 'low', 'medium', or 'high'"),
    body("created_by").optional().isInt().withMessage("Created_by must be an integer"),
    body("assigned_to").optional().isInt().withMessage("Assigned_to must be an integer"),
];


export const validateTodoFunc = (req: Request, res:Response, next: NextFunction) => {
   const errors = validationResult(req);
           if (!errors.isEmpty()) {
               logger.warn("Validation failed", { errors: errors.array() });
               res.status(400).json({ errors: errors.array() });
               return;
           }
    next();
}