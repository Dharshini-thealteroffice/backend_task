import redisClient from "../redisClient";
import {Request, Response} from "express";
import { AppDataSource } from "../data-source";
import { Todos } from "../entity/Todos";
import logger from "../logger"; 
import { Users } from "../entity/Users";
import { getTodosService } from "../services/todoService";


export const getTodos = async (req: Request, res: Response) => {
    try {
        const result = await getTodosService();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const postTodos = async (req: Request, res: Response): Promise<void> => {
        try {
            const { content, deadline, status, priority, created_by, assigned_to } = req.body;

            const todoRepository = AppDataSource.getRepository(Todos);
            const newTodo = todoRepository.create({ content, deadline, status, priority, created_by, assigned_to });
            await todoRepository.save(newTodo);

            await redisClient.del("todos_list");

            logger.info(`Todo created: ${newTodo.content}`);
            res.status(201).json({ message: "Todo created", todo: newTodo });
        } catch (error: any) {
            logger.error(`Error creating todo: ${error.message}`);
            res.status(500).json({ error: "Internal Server Error" });
        }
}

    export const getTodosByCID = async (req: Request, res: Response): Promise<void> => {
        const { user_id } = req.params;
        const id = user_id;
         
        if (isNaN(Number(id))) {
            res.status(400).json({ error: "Invalid ID: ID must be a number" });
            return;
        }

        const cacheKey = `todos_list_created_by_${id}`; 
    
        try {
            const cachedTodos = await redisClient.get(cacheKey);
            if (cachedTodos) {
                logger.info("Cache hit: Returning todos from Redis"); 
                res.json({ todos: JSON.parse(cachedTodos), cache: true });
                return;
            }
    
            const todoRepository = AppDataSource.getRepository(Todos);
            const todos = await todoRepository.find({ where: { created_by: { id: Number(id) } } });
    
            await redisClient.setEx(cacheKey, 60, JSON.stringify(todos));
    
            logger.info("Todos fetched from database"); 
             res.json({ todos, cache: false });
    
        } catch (error: any) {
            logger.error(`Error fetching todos: ${error.message}`);
             res.status(500).json({ error: "Internal Server Error" });
        }
    };
    
    export const getTodosByAID = async (req: Request, res: Response): Promise<void> => {
        const { user_id } = req.params;
        const id = user_id;

        if (isNaN(Number(id))) {
            res.status(400).json({ error: "Invalid ID: ID must be a number" });
            return;
        }

        const cacheKey = `todos_list_assigned_to_${id}`; 
    
        try {
            const cachedTodos = await redisClient.get(cacheKey);
            if (cachedTodos) {
                logger.info("Cache hit: Returning todos from Redis"); 
                res.json({ todos: JSON.parse(cachedTodos), cache: true });
                return;
            }
    
            const todoRepository = AppDataSource.getRepository(Todos);
            const todos = await todoRepository.find({ where: { assigned_to: { id: Number(id) } } });
    
            await redisClient.setEx(cacheKey, 60, JSON.stringify(todos));
    
            logger.info("Todos fetched from database"); 
             res.json({ todos, cache: false });
    
        } catch (error: any) {
            logger.error(`Error fetching todos: ${error.message}`);
             res.status(500).json({ error: "Internal Server Error" });
        }
    };
    
    export const deleteTodoById = async (req: Request, res: Response) => {
        const { todo_id } = req.params;
        const id= todo_id

        if (isNaN(Number(id))) {
            res.status(400).json({ error: "Invalid ID: ID must be a number" });
            return;
        }
    
        try {
            const todoRepository = AppDataSource.getRepository(Todos);

            const todo = await todoRepository.findOne({ where: { id: Number(id) } });
    
            if (!todo) {
                res.status(404).json({ error: "Todo not found" });
                return;
            }
    
            await todoRepository.remove(todo);
    
            const cacheKey1 = `todos_list_assigned_to_${todo.assigned_to?.id}`;
            await redisClient.del(cacheKey1);

            const cacheKey2 = `todos_list_created_by_${todo.created_by}`;
            await redisClient.del(cacheKey2);
    
            logger.info(`Todo with ID ${id} deleted successfully`);
            res.json({ message: "Todo deleted successfully" });
            return;
    
        } catch (error: any) {
            logger.error(`Error deleting todo: ${error.message}`);
            res.status(500).json({ error: "Internal Server Error" });
            return;
        }
    };

    export const updateTodoById = async (req: Request, res: Response): Promise<void> => {
        const { todo_id } = req.params;
        const id = todo_id
          
        if (isNaN(Number(id))) {
            res.status(400).json({ error: "Invalid ID: ID must be a number" });
            return;
        }

        const { content, deadline, status, priority, assigned_to, created_by } = req.body;
    
        try {
            const todoRepository = AppDataSource.getRepository(Todos);
            const userRepository = AppDataSource.getRepository(Users);
    
            const todo = await todoRepository.findOne({ where: { id: Number(id) } });
            if (!todo) {
                res.status(404).json({ error: "Todo not found" });
                return;
            }
    
            if (assigned_to !== undefined) {
                const assignedUser = await userRepository.findOne({ where: { id: Number(assigned_to) } });
                if (!assignedUser) {
                 res.status(400).json({ error: "Invalid assigned_to user ID" });
                 return;
                }
                todo.assigned_to = assignedUser;
            }
    
            if (created_by !== undefined) {
                const createdByUser = await userRepository.findOne({ where: { id: Number(created_by) } });
                if (!createdByUser) {
                    res.status(400).json({ error: "Invalid created_by user ID" });
                    return;
                } 
                todo.created_by = createdByUser;
            }
    
            if (deadline !== undefined) {
                const parsedDeadline = new Date(deadline);
                if (isNaN(parsedDeadline.getTime())) {
                     res.status(400).json({ error: "Invalid deadline format" });
                     return;
                }
                todo.deadline = parsedDeadline;
            }
    
            if (content !== undefined) todo.content = content;
            if (status !== undefined) todo.status = status;
            if (priority !== undefined) todo.priority = priority;
    
            await todoRepository.save(todo);
    
            const cacheKeys = [];
            if (todo.assigned_to?.id) {
                cacheKeys.push(`todos_list_assigned_to_${todo.assigned_to.id}`);
            }
            if (todo.created_by?.id) {
                cacheKeys.push(`todos_list_created_by_${todo.created_by.id}`);
            }
            await Promise.all(cacheKeys.map((key) => redisClient.del(key)));
            
    
            logger.info(`Todo with ID ${id} updated successfully`);
            res.json({ message: "Todo updated successfully" });
            return;
    
        } catch (error: any) {
            logger.error(`Error updating todo: ${error.message}`);
            res.status(500).json({ error: "Internal Server Error" });
            return;
        }
    };
    