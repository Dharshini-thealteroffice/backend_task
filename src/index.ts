import { AppDataSource } from "./data-source";
import logger from "./logger";  
import {createApp} from './app';

const app = createApp();
const PORT = process.env.PORT || 5000;

process.on("uncaughtException", (error: Error) => {
    logger.error(`Uncaught Exception: ${error.message}`);

});

process.on("unhandledRejection", (error: any) => {
    logger.error(`Unhandled Rejection: ${error}`);

});


AppDataSource.initialize()
    .then(() => {
        logger.info("Database connected successfully!"); 
        app.listen(PORT, () => {
            logger.info(`Server is running on http://localhost:${PORT}`); 
        });
    })
    .catch((error) => logger.error(`Database connection error: ${error.message}`)); 

