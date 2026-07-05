import { Router } from "express";
import { expensesService } from "../services/expenses.js";

const { get, getMany, create, update, remove } = expensesService;
const router: ReturnType<typeof Router> = Router();

router.route("/").get(getMany).post(create);
router.route("/:id").get(get).put(update).delete(remove);

export { router as expensesRouter };
