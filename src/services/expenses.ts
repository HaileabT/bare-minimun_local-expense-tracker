import { type Request, type Response } from "express";
import { categories, ExpenseCreate, expenses } from "../db/schema.js";
import { getDB } from "../db/index.js";
import { and, desc, eq, gte, inArray, like, lte, SQL } from "drizzle-orm";
import { CategoryFilters, ExpenseFilters } from "./types.js";
import { getIDParam, isValidDate, ValidationOutput } from "./utils.js";

function validateCreate(
  body: Omit<ExpenseCreate, "date"> & { date?: string },
): ValidationOutput<ExpenseCreate> {
  let newBody: ExpenseCreate = { ...body, date: undefined };
  if (!body) {
    return {
      success: false,
      error: "invalid data: nothing",
    };
  }
  if (!body.amount || typeof body.amount !== "number") {
    return {
      success: false,
      error: "invalid data: invalid amount",
    };
  }

  if (body.amount < 0) {
    newBody.amount *= -1;
  }

  if (!body.date) {
    newBody.date = new Date(Date.now());
  } else {
    newBody.date = isValidDate(body.date)
      ? new Date(body.date)
      : new Date(Date.now());
  }

  return {
    success: true,
    data: newBody,
  };
}

async function create(req: Request, res: Response) {
  let body: ExpenseCreate = req.body;
  const validated = validateCreate(body as ExpenseCreate & { date?: string });
  if (!validated.success) {
    res.status(422).json({
      msg: validated.error,
    });
    return;
  }

  body = validated.data!;
  console.log(validated);

  const db = getDB();

  if (body.categoryId) {
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, body.categoryId))
      .limit(1);
    if (!category) {
      body.categoryId = undefined;
    }
  }

  const insetResult = await db.insert(expenses).values(body).returning();

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

  let rawBody: Partial<Omit<ExpenseCreate, "date"> & { date?: string }> =
    req.body;
  if (!rawBody) {
    res.status(400).json({
      msg: "no data",
    });
    return;
  }

  rawBody = {
    ...rawBody,
    updatedAt: undefined,
    createdAt: undefined,
    id: undefined,
  };
  let body: Partial<ExpenseCreate> = { ...rawBody, date: undefined };

  if (rawBody.date) {
    const date = isValidDate(rawBody.date) ? new Date(rawBody.date) : undefined;

    body = { ...body, date };
  }

  const db = getDB();

  const oldRecord = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, idNum))
    .limit(1);
  if (!oldRecord || oldRecord.length < 1) {
    res.status(404).json({
      msg: "expense not found",
    });
    return;
  }

  if (
    body.categoryId !== null &&
    typeof body.categoryId !== "undefined" &&
    oldRecord[0]?.categoryId !== body.categoryId
  ) {
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, body.categoryId))
      .limit(1);
    if (!category) {
      body.categoryId = null;
    }
  }

  const updateResult = await db
    .update(expenses)
    .set(body)
    .where(eq(expenses.id, idNum))
    .returning();

  if (updateResult.length < 1) {
    res.status(500).json({
      msg: "couldnt update uhh",
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
    .from(expenses)
    .where(eq(expenses.id, idNum))
    .limit(1);
  if (result.length < 1) {
    res.status(404).json({
      msg: "expense not found",
    });
  }

  res.status(200).json(result[0]);
}

function buildWhere(query: Request["query"]) {
  console.log(query);
  let additionalNoteFilter: SQL | undefined = undefined;
  let amountFilter: SQL | undefined = undefined;
  let dateFiler: SQL | undefined = undefined;
  let creationDateFilter: SQL | undefined = undefined;
  let categoryFilter: SQL | undefined = undefined;
  const additionalNote = query.additionalNote
    ? query.additionalNote.toString().trim().length < 1
      ? undefined
      : query.additionalNote.toString().trim()
    : undefined;

  if (additionalNote) {
    additionalNoteFilter = like(expenses.additionalNote, `%${additionalNote}%`);
  }

  let amountsRaw = query.amount?.toString();
  if (amountsRaw && typeof amountsRaw === "string") {
    amountsRaw = amountsRaw as string;
    const amounts = {
      min: amountsRaw.split(",")[0],
      max: amountsRaw.split(",")[1],
    };
    let maxFilter: SQL | undefined = undefined;
    let minFilter: SQL | undefined = undefined;
    let max = amounts.max ? parseInt(amounts.max) : undefined;
    let min = amounts.min ? parseInt(amounts.min) : undefined;

    if (max) {
      max = max > 0 ? max : max * -1;
      maxFilter = lte(expenses.amount, max);
    }

    if (min) {
      min = min > 0 ? min : min * -1;
      minFilter = gte(expenses.amount, min);
    }

    amountFilter = and(maxFilter, minFilter);
  }

  const dateRaw = query.date?.toString();

  if (dateRaw && typeof dateRaw === "string") {
    const date = {
      from: dateRaw.split(",")[0],
      to: dateRaw.split(",")[1],
    };
    let fromFitler: SQL | undefined = undefined;
    let toFilter: SQL | undefined = undefined;
    let from = date.from;
    let to = date.to;

    const fromValid = isValidDate(from || "");
    const toValid = isValidDate(to || "");

    if (!fromValid) {
      from = undefined;
    }
    if (!toValid) {
      to = undefined;
    }

    if (from) {
      let fromDate: Date | undefined = new Date(from);
      if (fromDate.getTime() > Date.now()) {
        fromDate = undefined;
      }
      if (fromDate) fromFitler = gte(expenses.date, fromDate);
    }

    if (to) {
      let toDate = new Date(to);
      toFilter = lte(expenses.date, toDate);
    }

    dateFiler = and(fromFitler, toFilter);
  }

  const creationDateRaw = query.creationDate;
  if (creationDateRaw && typeof creationDateRaw === "string") {
    const creationDate = {
      from: creationDateRaw.split(",")[0],
      to: creationDateRaw.split(",")[1],
    };
    let fromFitler: SQL | undefined = undefined;
    let toFilter: SQL | undefined = undefined;
    let from = creationDate.from;
    let to = creationDate.to;

    const fromValid = isValidDate(from || "");
    const toValid = isValidDate(to || "");

    if (!fromValid) {
      from = undefined;
    }
    if (!toValid) {
      to = undefined;
    }

    if (from) {
      let fromDate: Date | undefined = new Date(from);
      if (fromDate.getTime() > Date.now()) {
        fromDate = undefined;
      }
      if (fromDate) fromFitler = gte(expenses.createdAt, fromDate);
    }

    if (to) {
      let toDate = new Date(to);
      toFilter = lte(expenses.createdAt, toDate);
    }

    creationDateFilter = and(fromFitler, toFilter);
  }

  let categoriesRaw = query.category?.toString();
  if (categoriesRaw && typeof categoriesRaw === "string") {
    let categoriesStr = categoriesRaw.split(",");
    const categories = categoriesStr
      .filter((c) => {
        try {
          const id = Number(c);
          return !isNaN(id);
        } catch {
          return false;
        }
      })
      .map((v) => Number(v));
    if (categories.length > 0) {
      categoryFilter = inArray(expenses.categoryId, categories);
    }
  }

  return and(
    additionalNoteFilter,
    amountFilter,
    dateFiler,
    creationDateFilter,
    categoryFilter,
  );
}

async function getMany(req: Request, res: Response) {
  const db = getDB();
  const where = buildWhere(req.query);
  const result = await db
    .select()
    .from(expenses)
    .where(where)
    .orderBy(desc(expenses.date));
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
    .delete(expenses)
    .where(eq(expenses.id, idNum))
    .returning();
  if (result.length < 1) {
    res.status(404).json({
      msg: "expense not deleted",
    });
  }

  res.status(204).send();
}

export const expensesService = { create, update, get, getMany, remove };
