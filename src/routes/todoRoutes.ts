import  express  from "express";
import { deleteTodoById, getTodos, getTodosByAID, getTodosByCID, postTodos, updateTodoById } from "../controllers/todoController";
import { validateTodo, validateTodoFunc, validateUpdateTodo } from "../middlewares/todoValidator";

const router = express.Router()

router.get('/', getTodos);
router.get('/created_by/:user_id', getTodosByCID);
router.get('/assigned_to/:user_id', getTodosByAID);
router.post('/', validateTodo, validateTodoFunc, postTodos);
router.delete('/delete/:todo_id', deleteTodoById);
router.put('/update/:todo_id', validateUpdateTodo, validateTodoFunc, updateTodoById)


export default router;