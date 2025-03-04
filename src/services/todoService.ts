import redisClient from "../redisClient";
import { AppDataSource } from "../data-source";
import { TodoPriority, Todos, TodoStatus } from "../entity/Todos";
import logger from "../logger"; 
import { Users } from "../entity/Users";
import { DeepPartial, Repository } from "typeorm";
import { CustomError } from "../middlewares/errorHandler";

const todoRepository = AppDataSource.getRepository(Todos);
const userRepository = AppDataSource.getRepository(Users);

export const getTodosService = async () => {
    const cacheKey = "todos_list";
    const cachedTodos = await redisClient.get(cacheKey);
    if (cachedTodos) {
        return { todos: JSON.parse(cachedTodos), cache: true };
    }

    const todos = await todoRepository.find(); 

    if (!todos || todos.length === 0) {
        throw new CustomError("No todos found", 404);
    }
    await redisClient.setEx(cacheKey, 60, JSON.stringify(todos));
    return { todos, cache: false };
};

export const getTodosByUserIdService = async (userId: number, type: string) => {
    const cacheKey = `todos_${type}_by_${userId}`;

    const cachedTodos = await redisClient.get(cacheKey);
    if (cachedTodos) {
        return { todos: JSON.parse(cachedTodos), cache: true };
    }

    let todos;
    if (type === "created") {
        todos = await todoRepository.find({ where: { created_by: { id: userId } } });
    } else if (type === "assigned") {
        todos = await todoRepository.find({ where: { assigned_to: { id: userId } } });
    } else {
        throw new CustomError("Invalid type: Use 'created' or 'assigned'", 400);
    }

    if (!todos || todos.length === 0) {
        throw new CustomError(`No ${type} todos found for user ${userId}`, 404);
    }

    await redisClient.setEx(cacheKey, 60, JSON.stringify(todos));

    return { todos, cache: false };
};

export const deleteTodoByIdService = async (todoId: number) => {

        const todoRepository = AppDataSource.getRepository(Todos);
        const todo = await todoRepository.findOne({ where: { id: todoId } });

        if (!todo) {
            throw new CustomError("todo not found", 404);
        }

        await todoRepository.remove(todo);

        const cacheKey1 = `todos_list_assigned_to_${todo.assigned_to?.id}`;
        await redisClient.del(cacheKey1);

        const cacheKey2 = `todos_list_created_by_${todo.created_by}`;
        await redisClient.del(cacheKey2);

        logger.info(`Todo with ID ${todoId} deleted successfully`);
        return { message: "Todo deleted successfully" };   
};

export const updateTodoByIdService = async (
    todoId: number,
    updates: {
        content?: string;
        deadline?: string;
        status?: TodoStatus; 
        priority?: TodoPriority; 
        assigned_to?: number;
        created_by?: number;
    }
) => {
 
      
        const todo = await todoRepository.findOne({ where: { id: todoId } });
        if (!todo) {
            throw new CustomError("todo not found", 404);
        }

        if (updates.assigned_to !== undefined) {
            const assignedUser = await userRepository.findOne({ where: { id: updates.assigned_to } });
            if (!assignedUser) {
                throw new CustomError("Invalid assigned_to user ID", 400);
            }
            todo.assigned_to = assignedUser;
        }

        if (updates.created_by !== undefined) {
            const createdByUser = await userRepository.findOne({ where: { id: updates.created_by } });
            if (!createdByUser) {
                throw new CustomError("Invalid created_by user ID", 400);
            }
            todo.created_by = createdByUser;
        }

        if (updates.deadline !== undefined) {
            const parsedDeadline = new Date(updates.deadline);
            if (isNaN(parsedDeadline.getTime())) {
                throw new CustomError("Invalid deadline format", 400);
            }
            todo.deadline = parsedDeadline;
        }

        if (updates.content !== undefined) todo.content = updates.content;
        if (updates.status !== undefined) todo.status = updates.status;
        if (updates.priority !== undefined) todo.priority = updates.priority;

        await todoRepository.save(todo);

        const cacheKeys = [];
        if (todo.assigned_to?.id) {
            cacheKeys.push(`todos_list_assigned_to_${todo.assigned_to.id}`);
        }
        if (todo.created_by?.id) {
            cacheKeys.push(`todos_list_created_by_${todo.created_by.id}`);
        }
        await Promise.all(cacheKeys.map((key) => redisClient.del(key)));

        logger.info(`Todo with ID ${todoId} updated successfully`);
        return { message: "Todo updated successfully" };
  
};

export const getTodosCountByStatusService = async () => {
    const cacheKey = "todos_count_by_status";
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            logger.info("Cache hit: Returning todos count by status from Redis");
            return { data: JSON.parse(cachedData), cache: true };
        }

        const todosCount = await todoRepository
            .createQueryBuilder("todo")
            .select("todo.status, COUNT(todo.id) as count")
            .groupBy("todo.status")
            .getRawMany();

        await redisClient.setEx(cacheKey, 60, JSON.stringify(todosCount));

        logger.info("Todos count by status fetched from database");
        return { data: todosCount, cache: false };
};

export const getTodosCountByPriorityService = async () => {
    const cacheKey = "todos_count_by_priority";


        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            logger.info("Cache hit: Returning todos count by priority from Redis");
            return { data: JSON.parse(cachedData), cache: true };
        }
        const todoRepository = AppDataSource.getRepository(Todos);

        const todosCount = await todoRepository
            .createQueryBuilder("todo")
            .select("todo.priority, COUNT(todo.id) as count")
            .where("todo.status != :status", { status: "completed" })
            .groupBy("todo.priority")
            .getRawMany();

        await redisClient.setEx(cacheKey, 60, JSON.stringify(todosCount));

        logger.info("Todos count by priority fetched from database");
        return { data: todosCount, cache: false };

  
};

export const getUserTaskStatsService = async (userId: number) => {

        const todoRepository = AppDataSource.getRepository(Todos);

        const [assignedTasks, completedTasks] = await Promise.all([
            todoRepository
                .createQueryBuilder("todo")
                .select("COUNT(todo.id) as count")
                .where("todo.assigned_to = :userId", { userId })
                .getRawOne(),

            todoRepository
                .createQueryBuilder("todo")
                .select("COUNT(todo.id) as count")
                .where("todo.assigned_to = :userId", { userId })
                .andWhere("todo.status = :status", { status: "completed" })
                .getRawOne(),
        ]);

        logger.info(`Fetched task stats for user ID ${userId}`);

        return {
            assignedTasks: assignedTasks.count || 0,
            completedTasks: completedTasks.count || 0,
            completionRate:
                assignedTasks?.count && Number(assignedTasks.count) > 0
                    ? Math.ceil((Number(completedTasks.count) / Number(assignedTasks.count)) * 100)
                    : 0,
            cache: false,
        };
    
};

export const getTodosPastDeadlineService = async () => {
   
        const cacheKey = "todos_past_deadline";

        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            logger.info("Cache hit: Returning todos past deadline from Redis");
            return { data: JSON.parse(cachedData), cache: true };
        }

        const createdTasks = await todoRepository
            .createQueryBuilder("todo")
            .where("todo.deadline < :date", { date: new Date() })
            .getRawMany();

        await redisClient.setEx(cacheKey, 60, JSON.stringify(createdTasks));

        logger.info("Todos past deadline fetched from database");

        return { data: createdTasks, cache: false };
  
};

export const getAllUserTaskStatsService = async () => {

        const userTaskStats = await AppDataSource.getRepository(Users)
            .createQueryBuilder("user")
            .leftJoin(Todos, "todo", "todo.assigned_to = user.id")
            .select([
                "user.name AS userName",
                "COUNT(todo.id) AS assignedTasks",
                "SUM(CASE WHEN todo.status = 'completed' THEN 1 ELSE 0 END) AS completedTasks"
            ])
            .groupBy("user.id")
            .getRawMany();

        logger.info("User task stats fetched successfully");
        return { data: userTaskStats };
  
};


export const postTodoService = async (todoData: {
    content: string;
    deadline: Date;
    status: string;
    priority: string;
    created_by: number;
    assigned_to: number;
}) => {
        const todoRepository = AppDataSource.getRepository(Todos);

        const newTodo: Todos = todoRepository.create(todoData as DeepPartial<Todos>);
        
        await todoRepository.save(newTodo);

        await redisClient.del("todos_list");

        logger.info(`Todo created: ${newTodo.content}`);
        return { message: "Todo created", todo: newTodo };
};
