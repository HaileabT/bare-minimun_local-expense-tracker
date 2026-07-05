import { type Request, type Response } from "express";
import { readFile, stat, writeFile } from "node:fs/promises";
import { SettingsType } from "../data/settings-type.js";

const DEFAULT_SETTINGS: SettingsType = {
  monthStart: 1,
  theme: "system",
  spendingGoal: 32000,
};

function getSettingsPath() {
  return `${import.meta.dirname}/../data/settings.json`;
}

function validateUpdate(body: object): Partial<SettingsType> {
  const settingsUpdate: Partial<SettingsType> = {};
  if ("monthStart" in body) {
    let monthStart = body["monthStart"];
    if (typeof monthStart !== "number") {
      settingsUpdate.monthStart = undefined;
    } else {
      monthStart =
        monthStart > 28 ? 28 : monthStart < 1 ? 1 : (monthStart as number);
      settingsUpdate.monthStart = monthStart as number;
    }
  }

  if ("spendingGoal" in body) {
    let spending = body["spendingGoal"];
    if (typeof spending !== "number") {
      settingsUpdate.spendingGoal = undefined;
    } else {
      spending =
        spending > Number.MAX_SAFE_INTEGER
          ? Number.MAX_SAFE_INTEGER
          : spending < 1
            ? 1
            : (spending as number);
      settingsUpdate.spendingGoal = spending as number;
    }
  }

  if ("theme" in body) {
    let theme = body["theme"] as string;
    if (typeof theme !== "string") {
      settingsUpdate.theme = undefined;
    } else {
      if (!["light", "dark", "system"].includes(theme.toLowerCase())) {
        theme = "system";
      }
      settingsUpdate.theme = theme.toLowerCase();
    }
  }

  return settingsUpdate;
}

async function get(req: Request, res: Response) {
  try {
    const raw = await readFile(getSettingsPath(), {
      encoding: "utf-8",
    }).catch((err) => {
      throw new Error(
        `couldnt read settings file ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    const settings: SettingsType = JSON.parse(raw);

    res.status(200).json(settings);
  } catch (err) {
    console.error(
      `couldnt get settings file ${err instanceof Error ? err.message : String(err)}`,
    );
    res.status(500).json({
      msg: "couldnt get settings",
    });
  }
}
async function update(req: Request, res: Response) {
  try {
    const body: Partial<SettingsType> | undefined = req.body;
    if (!body) {
      res.status(200).json();
      return;
    }

    const updateSettings = validateUpdate(body);
    const currentSettings = await seed();
    if (!currentSettings) {
      res.status(500).json({
        msg: "settings is cooked",
      });
      return;
    }
    const merged: SettingsType = {
      monthStart: updateSettings.monthStart || currentSettings.monthStart,
      theme: updateSettings.theme || currentSettings.theme,
      spendingGoal: updateSettings.spendingGoal || currentSettings.spendingGoal,
    };

    await writeFile(getSettingsPath(), JSON.stringify(merged), {
      encoding: "utf-8",
      flush: true,
    });

    res.status(200).json(merged);
  } catch (err) {
    console.error(
      `couldnt update settings file ${err instanceof Error ? err.message : String(err)}`,
    );
    res.status(500).json({
      msg: "couldnt update settings",
    });
  }
}

async function reset(req: Request, res: Response) {
  try {
    await writeFile(getSettingsPath(), JSON.stringify(DEFAULT_SETTINGS), {
      flush: true,
      encoding: "utf-8",
    }).catch((err) => {
      throw new Error(
        `couldnt write settings file ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    res.status(200).json(DEFAULT_SETTINGS);
  } catch (err) {
    console.error(
      `couldnt reset settings file ${err instanceof Error ? err.message : String(err)}`,
    );
    res.status(500).json({
      msg: "couldnt reset settings",
    });
  }
}

async function seed() {
  try {
    const settingsPath = getSettingsPath();
    const stats = await stat(settingsPath).catch((err) => {
      throw new Error(
        `couldnt get stats of settings file ${err instanceof Error ? err.message : String(err)}`,
      );
    });
    const isFile = stats.isFile();
    if (!isFile) {
      await writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS), {
        flush: true,
        encoding: "utf-8",
      }).catch((err) => {
        throw new Error(
          `couldnt write settings file ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    } else {
      const fileData = await readFile(settingsPath, {
        encoding: "utf-8",
      }).catch((err) => {
        throw new Error(
          `couldnt read settings file ${err instanceof Error ? err.message : String(err)}`,
        );
      });
      try {
        return JSON.parse(fileData) as SettingsType;
      } catch (err) {
        console.error("invalid settings json overriding:", err);
        await writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS), {
          flush: true,
          encoding: "utf-8",
        }).catch((err) => {
          throw new Error(
            `couldnt write settings file ${err instanceof Error ? err.message : String(err)}`,
          );
        });
      }
    }
  } catch (err) {
    console.error(
      "couldnt seed settings",
      err instanceof Error ? err.message : String(err),
    );
    throw err;
  }
}

export const settingsService = { update, reset, seed, get };
