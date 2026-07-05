import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm/_relations";
import { int, integer, text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core/table";

export const categories = sqliteTable("expense_categories", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdateFn(() => sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const expenses = sqliteTable("expenses", {
  id: int().primaryKey({ autoIncrement: true }),
  categoryId: int("expense_category").references(() => categories.id, {
    onDelete: "set null",
    onUpdate: "no action",
  }),
  additionalNote: text(),
  date: integer("date", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  amount: int().notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdateFn(() => sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const categoryRelations = relations(categories, ({ many }) => {
  return {
    expenses: many(expenses),
  };
});

export const expenseRelations = relations(expenses, ({ one }) => {
  return {
    category: one(categories, {
      fields: [expenses.categoryId],
      references: [categories.id],
      relationName: "expense_categories",
    }),
  };
});

export type CategoryType = typeof categories.$inferSelect;
export type CategoryCreate = typeof categories.$inferInsert;

export type ExpenseType = typeof expenses.$inferSelect;
export type ExpenseCreate = typeof expenses.$inferInsert;
