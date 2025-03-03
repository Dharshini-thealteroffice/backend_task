/* eslint-env jest */

import request from "supertest";
import { createApp } from "../app"; 
import { AppDataSource } from "../data-source";;
import redisClient from "../redisClient";

const app = createApp();

// Mock Redis
jest.mock("../redisClient", () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
}));

// Mock TypeORM Repository
const mockRepository = {
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};

const mockUserRepository = {
  findOne: jest.fn(),
};

jest.mock("../data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockRepository),
    initialize: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
  },
}));

beforeAll(async () => {
  await AppDataSource.initialize(); 
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Todos API", () => {
  
  it("should return todos from Redis cache", async () => {
    const mockTodos = [{ id: 1, content: "Test Todo" }];
    (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockTodos));

    const response = await request(app).get("/todos");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ todos: mockTodos, cache: true });
    expect(redisClient.get).toHaveBeenCalledWith("todos_list"); 
  });

  it("should fetch todos from database if not cached", async () => {
    const mockTodos = [{ id: 1, content: "Test Todo" }];
    (redisClient.get as jest.Mock).mockResolvedValue(null);
    mockRepository.find.mockResolvedValue(mockTodos);

    const response = await request(app).get("/todos");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ todos: mockTodos, cache: false });
    expect(mockRepository.find).toHaveBeenCalled();
    expect(redisClient.setEx).toHaveBeenCalled(); 
  });

  it("should create a new todo", async () => {
    const newTodo = {
      content: "New Task",
      deadline: "2025-01-01T00:00:00.000Z",
      status: "pending",
      priority: "high",
      created_by: 1,
      assigned_to: 2,
    };

    mockRepository.create.mockReturnValue(newTodo);
    mockRepository.save.mockResolvedValue(newTodo);

    const response = await request(app).post("/todos").send(newTodo);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: "Todo created", todo: newTodo });
    expect(mockRepository.create).toHaveBeenCalledWith(newTodo);
    expect(mockRepository.save).toHaveBeenCalledWith(newTodo);
    expect(redisClient.del).toHaveBeenCalledWith("todos_list"); // Ensure cache was cleared
  });
});

describe("GET /todos/created_by/:id", () => {
  const userId = 1;
  const cacheKey = `todos_list_created_by_${userId}`;
  const mockTodos = [{ id: 1, content: "Test Todo", created_by: userId }];

  it("should return todos from Redis cache", async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockTodos));

    const response = await request(app).get(`/todos/created_by/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ todos: mockTodos, cache: true });
    expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
  });

  it("should fetch todos from database if not cached", async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(null);
    mockRepository.find.mockResolvedValue(mockTodos);

    const response = await request(app).get(`/todos/created_by/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ todos: mockTodos, cache: false });
    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { created_by: { id: userId } },
    });
    expect(redisClient.setEx).toHaveBeenCalledWith(cacheKey, 60, JSON.stringify(mockTodos));
  });

  it("should return 500 on server error", async () => {
    (redisClient.get as jest.Mock).mockRejectedValue(new Error("Redis failure"));

    const response = await request(app).get(`/todos/created_by/${userId}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal Server Error" });
  });
});

describe("GET /todos/assigned_to/:id", () => {
  const userId = 1;
  const cacheKey = `todos_list_assigned_to_${userId}`;
  const mockTodos = [{ id: 1, content: "Test Todo", assigned_to: userId }];

  it("should return todos from Redis cache", async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockTodos));

    const response = await request(app).get(`/todos/assigned_to/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ todos: mockTodos, cache: true });
    expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
  });

  it("should fetch todos from database if not cached", async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(null);
    mockRepository.find.mockResolvedValue(mockTodos);

    const response = await request(app).get(`/todos/assigned_to/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ todos: mockTodos, cache: false });
    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { created_by: { id: userId } },
    });
    expect(redisClient.setEx).toHaveBeenCalledWith(cacheKey, 60, JSON.stringify(mockTodos));
  });

  it("should return 500 on server error", async () => {
    (redisClient.get as jest.Mock).mockRejectedValue(new Error("Redis failure"));

    const response = await request(app).get(`/todos/assigned_to/${userId}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal Server Error" });
  });
});

describe("Todo Controller Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("DELETE /todos/delete/:id", () => {
    it("should delete a todo successfully", async () => {
      const todo = { id: 1, assigned_to: { id: 2 }, created_by: 3 };

      (mockRepository.findOne).mockResolvedValue(todo);
      (mockRepository.remove).mockResolvedValue(null);
      (redisClient.del as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete("/todos/delete/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Todo deleted successfully" });
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.remove).toHaveBeenCalledWith(todo);
      expect(redisClient.del).toHaveBeenCalledWith("todos_list_assigned_to_2");
      expect(redisClient.del).toHaveBeenCalledWith("todos_list_created_by_3");
    });

    it("should return 404 if todo not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app).delete("/todos/delete/1");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Todo not found" });
    });

    it("should handle server errors", async () => {
      mockRepository.findOne.mockRejectedValue(new Error("DB Error"));

      const response = await request(app).delete("/todos/delete/1");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Internal Server Error" });
    });
  });

  describe("PUT /todos/update/:id", () => {
    const todoId = 1;
    const updatedTodo = {
      content: "Updated Task",
      deadline: "2025-02-01T00:00:00.000Z",
      status: "completed",
      priority: "medium",
      created_by: 1,
      assigned_to: 2,
    };
  
    it("should return 404 if todo not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);
  
      const response = await request(app).put(`/todos/update/${todoId}`).send(updatedTodo);
  
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Todo not found" });
    });
  
    it("should return 500 on server error", async () => {
      mockRepository.findOne.mockRejectedValue(new Error("DB Error"));
  
      const response = await request(app).put(`/todos/update/${todoId}`).send(updatedTodo);
  
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Internal Server Error" });
    });
  });
  

});