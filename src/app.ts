import express, { Application } from "express";
import dotenv from "dotenv";
import todoRoutes from "../src/routes/todoRoutes";

dotenv.config();

export const createApp = (): Application => {
  const app = express();

  app.use(express.json());

  app.use("/todos", todoRoutes);

   return app;
};
