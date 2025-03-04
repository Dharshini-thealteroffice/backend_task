import {NextFunction, Request, Response} from "express";
import { deleteTodoByIdService, getAllUserTaskStatsService, getTodosByUserIdService, getTodosCountByPriorityService, getTodosCountByStatusService, getTodosPastDeadlineService, getTodosService, getUserTaskStatsService, postTodoService, updateTodoByIdService } from "../services/todoService";
import { CustomError } from "../middlewares/errorHandler";

export const getTodos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await getTodosService();
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const postTodos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const todoData = req.body;
        const result = await postTodoService(todoData);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const getTodosByUserId = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.params;
    const { type } = req.query;
    const userId = Number(user_id);

    try {
        if (isNaN(userId)) {
            throw new CustomError("Invalid ID: ID must be a number", 400);
        }
    
        if (!type || (type !== "created" && type !== "assigned")) {
            throw new CustomError("Invalid type: Use 'created' or 'assigned'", 400);
        }
        const result = await getTodosByUserIdService(userId, type as string);
        res.status(200).json(result);
    } catch (error) {
        next(error); 
    }
};
    
export const deleteTodoById = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    const { todo_id } = req.params;
    const id = Number(todo_id);

    try{
        if (isNaN(id)) {
            throw new CustomError("Invalid ID: ID must be a number", 400);
        }
    
       const result = await deleteTodoByIdService(id);
       res.json(result); 
    }catch (error) {
        next(error);
    }
};

export const updateTodoById = async (req: Request, res: Response, next: NextFunction): Promise<void>  => {
    const { todo_id } = req.params;
    const id = Number(todo_id);

    try{
        if (isNaN(id)) {
            throw new CustomError("Invalid ID: ID must be a number", 400);
        }
    
        const updates = req.body;
    const result = await updateTodoByIdService(id, updates);

     res.json(result);
     return;
    }catch (error) {
        next(error);
    }
};

export const getTodosCountByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await getTodosCountByStatusService();
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getTodosCountByPriority = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await getTodosCountByPriorityService();
        res.json(result);
    } catch (error) {
        next(error);
    }
};
    

export const getUserTaskStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    
    try {
        const { user_id } = req.params;
    const userId = Number(user_id);

    if (isNaN(userId)) {
        throw new CustomError("Invalid ID: ID must be a number", 400);
    }

        const result = await getUserTaskStatsService(userId);
        res.json(result);
    } catch (error: any) {
        next(error);
    }
};
    
export const getTodosPastDeadline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await getTodosPastDeadlineService();
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getAllUserTaskStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await getAllUserTaskStatsService();
        res.json(result);
    } catch (error: any) {
        next(error);
    }
};

    
    
    