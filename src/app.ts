import express, { Application } from "express";
import todoRoutes from "../src/routes/todoRoutes";
import { errorHandler } from "./middlewares/errorHandler";

export const createApp = (): Application => {
  const app = express();

  app.use(express.json());

  app.use("/todos", todoRoutes);

  app.use(errorHandler);

  return app;
};
