import { AppDataSource } from "./data-source";
import logger from "./logger";  
import {createApp} from './app';
import dotenv from 'dotenv'

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
    .then(() => {
        logger.info("Database connected successfully!"); 
        app.listen(PORT, () => {
            logger.info(`Server is running on http://localhost:${PORT}`); 
        });
    })
    .catch((error) => logger.error(`Database connection error: ${error.message}`)); 

