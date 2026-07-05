import { Router } from "express";
import { categoryService } from "../services/categories.js";

const { get, getMany, create, update, remove } = categoryService;
const router: ReturnType<typeof Router> = Router();

router.route("/").get(getMany).post(create);
router.route("/:id").get(get).put(update).delete(remove);

export { router as categoriesRouter };
