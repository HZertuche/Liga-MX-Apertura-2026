import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jornadasTable = pgTable("jornadas", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  name: text("name").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status", { enum: ["upcoming", "active", "finished"] }).notNull().default("upcoming"),
});

export const insertJornadaSchema = createInsertSchema(jornadasTable).omit({ id: true });
export type InsertJornada = z.infer<typeof insertJornadaSchema>;
export type Jornada = typeof jornadasTable.$inferSelect;
