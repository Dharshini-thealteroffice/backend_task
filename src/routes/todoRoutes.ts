import  express  from "express";
import { deleteTodoById, getAllUserTaskStats, getTodos, getTodosByUserId, getTodosCountByPriority, getTodosCountByStatus, getTodosPastDeadline, getUserTaskStats, postTodos, updateTodoById } from "../controllers/todoController";
import { validateTodo, validateTodoFunc, validateUpdateTodo } from "../middlewares/todoValidator";

const router = express.Router()

router.get('/todosPastDeadline', getTodosPastDeadline)
//get all user's assigned todo count and completed todo count
router.get('/getAllUserTaskStats', getAllUserTaskStats)
// get count of todos based on status (in-progress, completed, pending)
router.get('/todosCountByStatus', getTodosCountByStatus) 
// get count of todos that are not completed based on priority (high, low, medium)
router.get('/todosCountByPriority', getTodosCountByPriority)
router.get('/', getTodos);
router.post('/', validateTodo, validateTodoFunc, postTodos);
router.delete('/delete/:todo_id', deleteTodoById);
router.put('/update/:todo_id', validateUpdateTodo, validateTodoFunc, updateTodoById)
// get created_by or assigned_to todos for a particular user
router.get("/:user_id", getTodosByUserId);
// get user's assigned, competeleted todos, along with completion rate
router.get('/userTaskStats/:user_id', getUserTaskStats)



export default router;