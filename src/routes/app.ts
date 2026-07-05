import { Router } from "express";
import { appService } from "../services/app.js";

const { backupDatabase, restoreDatabase, getBackupList } = appService;

const router: ReturnType<typeof Router> = Router();

router.get("/backups", getBackupList);
router.post("/backups/backup-db", backupDatabase);
router.post("/backups/restore-db", restoreDatabase);

export { router as appRouter };
