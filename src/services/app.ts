import "dotenv";
import { existsSync } from "node:fs";
import { Request, Response } from "express";
import { copyFile, mkdir, readdir, unlink } from "node:fs/promises";
import { getDB } from "../db/index.js";
import { sql } from "drizzle-orm";

async function backupDatabase(req: Request, res: Response) {
  const today = new Date().toISOString().slice(0, 10);

  if (!existsSync("backups")) {
    await mkdir("backups", { recursive: true });
  }

  const backupPath = `backups/${today}.sqlite`;
  let backupRenamed = false;
  let newBackupPath: string | undefined;
  if (existsSync(backupPath)) {
    newBackupPath = `backups/${today}-${Date.now()}.sqlite`;
    await copyFile(backupPath, newBackupPath);
    await unlink(backupPath);
    backupRenamed = true;
  }

  const db = getDB();
  try {
    await db.run(sql.raw(`VACUUM INTO 'file:${backupPath}'`));
    if (backupRenamed && newBackupPath) {
      await unlink(newBackupPath);
    }
    return res.status(200).json({ msg: "Backup created successfully" });
  } catch (err) {
    if (backupRenamed && newBackupPath) {
      await copyFile(newBackupPath, backupPath);
    }
    console.error(err);
    return res.status(500).json({ msg: "Failed to create backup" });
  }
}

async function restoreDatabase(req: Request, res: Response) {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ msg: "No filename provided" });
  }

  const backupPath = `backups/${filename}.sqlite`;
  if (!existsSync(backupPath)) {
    return res.status(404).json({ msg: "Backup not found" });
  }

  const originalDbPath = process.env.DB_FILE_NAME || "expenses.sqlite";

  try {
    await copyFile(backupPath, originalDbPath);
    return res.status(200).json({ msg: "Backup restored successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Failed to restore backup" });
  }
}

async function getBackupList(req: Request, res: Response) {
  const backupDir = "backups";
  if (!existsSync(backupDir)) {
    return res.status(404).json({ msg: "No backups found" });
  }

  const backups = await readdir(backupDir);
  return res.status(200).json(backups.map((b) => b.split(".")[0]));
}

export const appService = {
  backupDatabase,
  restoreDatabase,
  getBackupList,
};
