import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from 'dotenv';
import { Users } from "./entity/Users";
import { Todos } from "./entity/Todos";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ,
  synchronize: true, 
  logging: true,
  entities: [Users, Todos], 
  migrations: ["src/migration/**/*.ts"],
  subscribers: [],
});
