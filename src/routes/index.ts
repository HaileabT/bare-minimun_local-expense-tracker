import { Router } from "express";
import { expensesRouter } from "./expenses.js";
import { categoriesRouter } from "./categories.js";
import { settingsRouter } from "./settings.js";
import { appRouter } from "./app.js";

const router: ReturnType<typeof Router> = Router();

router.use("/app", appRouter);
router.use("/expenses", expensesRouter);
router.use("/categories", categoriesRouter);
router.use("/settings", settingsRouter);

export { router };
