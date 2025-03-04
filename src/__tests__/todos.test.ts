/* eslint-env jest */

import request from "supertest";
import { createApp } from "../app"; 
import { AppDataSource } from "../data-source";;
import redisClient from "../redisClient";

const app = createApp();

jest.mock("../redisClient", () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
}));

const mockRepository = {
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};

jest.mock("../data-source", () => {
  const mockRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  return {
    AppDataSource: {
      getRepository: jest.fn(() => mockRepository),
      initialize: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
    },
  };
});

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


});

describe("GET /todos/created_by/:id", () => {
  const userId = 1;
  const cacheKey = `todos_created_by_${userId}`;
  const mockTodos = [{ id: 1, content: "Test Todo", created_by: userId }];

  it("should return todos from Redis cache", async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockTodos));
    const response = await request(app).get(`/todos/${userId}?type=created`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ todos: mockTodos, cache: true });
    expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
  });

 
});

describe("GET /todos/todosCountByPriority", () => {
  const cacheKey = "todos_count_by_priority";
  const mockTodos = [{ id: 1, content: "Test Todo" }];

  it("should return todos from Redis cache", async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockTodos));
    const response = await request(app).get(`/todos/todosCountByPriority`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: mockTodos, cache: true });
    expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
  });
 
});

describe("GET /todos/todosCountByStatus", () => {
  const cacheKey = "todos_count_by_status";
  const mockTodos = [{ id: 1, content: "Test Todo" }];

  it("should return todos from Redis cache", async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockTodos));
    const response = await request(app).get(`/todos/todosCountByPriority`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: mockTodos, cache: true });
    const temp =(redisClient.get(cacheKey))
    expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
  });
 
});

describe("GET /todos/todosCountByPriority", () => {
  const cacheKey = "todos_count_by_priority";
  const mockTodos = [{ id: 1, content: "Test Todo" }];

  it("should return todos from Redis cache", async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockTodos));
    const response = await request(app).get(`/todos/todosCountByPriority`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: mockTodos, cache: true });
    expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
  });
});

describe("GET /todos/assigned_to/:id", () => {
  const userId = 1;
  const cacheKey = `todos_assigned_by_${userId}`;
  const mockTodos = [{ id: 1, content: "Test Todo", assigned_to: userId }];

  it("should return todos from Redis cache", async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockTodos));
    const response = await request(app).get(`/todos/${userId}?type=assigned`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ todos: mockTodos, cache: true });
    expect(redisClient.get).toHaveBeenCalledWith(cacheKey);
  });

});

describe("Todo Controller Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("DELETE /todos/delete/:id", () => {
    it("should return 404 if todo not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const response = await request(app).delete("/todos/delete/1");
      expect(response.status).toBe(404);
    });
  });

});