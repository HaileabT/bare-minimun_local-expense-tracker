import { type Request, type Response } from "express";
import { categories } from "../db/schema.js";
import { getDB } from "../db/index.js";
import { eq, like } from "drizzle-orm";
import { CategoryFilters } from "./types.js";
import { getIDParam } from "./utils.js";

async function create(req: Request, res: Response) {
  if (!req.body) {
    res.status(400).json({
      msg: "no body",
    });
    return;
  }

  let name: string | undefined = req.body.name;
  name = typeof name === "string" ? name.trim() : undefined;

  if (!name || name.length < 1) {
    res.status(400).json({
      msg: "no name",
    });
    return;
  }

  name = name.toLowerCase();
  const db = getDB();

  const insetResult = await db.insert(categories).values({ name }).returning();

  if (insetResult.length < 1) {
    res.status(500).json({
      msg: "couldnt insert uhh",
    });
    return;
  }

  res.status(201).json(insetResult[0]);
}

async function update(req: Request, res: Response) {
  const idRes = getIDParam(req.params);
  if (idRes.err) {
    res.status(400).json({
      msg: idRes.err,
    });
    return;
  }
  const idNum = idRes.id!;

  if (!req.body) {
    res.status(400).json({
      msg: "no body",
    });
    return;
  }

  let name: string | undefined = req.body.name;
  name = typeof name === "string" ? name.trim() : undefined;

  if (!name || name.length < 1) {
    res.status(400).json({
      msg: "no name",
    });
    return;
  }

  name = name.toLowerCase();
  const db = getDB();

  const updateResult = await db
    .update(categories)
    .set({
      name,
    })
    .where(eq(categories.id, idNum))
    .returning();

  if (updateResult.length < 1) {
    res.status(500).json({
      msg: "couldnt insert uhh",
    });
    return;
  }

  res.status(200).json(updateResult[0]);
}

async function get(req: Request, res: Response) {
  const idRes = getIDParam(req.params);
  if (idRes.err) {
    res.status(400).json({
      msg: idRes.err,
    });
    return;
  }
  const idNum = idRes.id!;

  const db = getDB();

  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, idNum))
    .limit(1);
  if (result.length < 1) {
    res.status(404).json({
      msg: "category not found",
    });
  }

  res.status(200).json(result[0]);
}

function buildWhere(query: CategoryFilters) {
  const name = query.name
    ? query.name.trim().length < 1
      ? undefined
      : query.name.trim()
    : undefined;

  if (name) {
    return like(categories.name, `%${name}%`);
  }
}

async function getMany(req: Request, res: Response) {
  const db = getDB();
  const where = buildWhere(req.query);
  const result = await db.select().from(categories).where(where);
  res.status(200).json(result);
}

async function remove(req: Request, res: Response) {
  const idRes = getIDParam(req.params);
  if (idRes.err) {
    res.status(400).json({
      msg: idRes.err,
    });
    return;
  }
  const idNum = idRes.id!;

  const db = getDB();

  const result = await db
    .delete(categories)
    .where(eq(categories.id, idNum))
    .returning();
  if (result.length < 1) {
    res.status(404).json({
      msg: "category not deleted",
    });
  }

  res.status(204).send();
}

export const categoryService = { create, update, get, getMany, remove };
