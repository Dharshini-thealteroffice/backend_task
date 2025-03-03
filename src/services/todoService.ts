import redisClient from "../redisClient";
import { AppDataSource } from "../data-source";
import { Todos } from "../entity/Todos";
import logger from "../logger"; 

const todoRepository = AppDataSource.getRepository(Todos);

export const getTodosService = async () => {
    const cacheKey = "todos_list";

    try {
        const cachedTodos = await redisClient.get(cacheKey);
        if (cachedTodos) {
            logger.info("Cache hit: Returning todos from Redis");
            return { todos: JSON.parse(cachedTodos), cache: true };
        }

        const todos = await todoRepository.find({
            relations: ["assigned_to", "created_by"], 
        });

        await redisClient.setEx(cacheKey, 60, JSON.stringify(todos));

        logger.info("Todos fetched from database");
        return { todos, cache: false };

    } catch (error: any) {
        logger.error(`Error fetching todos: ${error.message}`);
        throw new Error("Internal Server Error");
    }
};
