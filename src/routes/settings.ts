import { Router } from "express";
import { settingsService } from "../services/settings.js";

const { update, reset, get } = settingsService;
const router: ReturnType<typeof Router> = Router();

router.route("/").get(get).put(update);
router.route("/reset").post(reset);

export { router as settingsRouter };
