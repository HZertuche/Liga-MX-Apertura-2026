import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const standingsHistoryTable = pgTable("standings_history", {
  id: serial("id").primaryKey(),

  jornadaId: integer("jornada_id").notNull(),

  userId: integer("user_id").notNull(),

  position: integer("position").notNull(),

  points: integer("points").notNull().default(0),

  exactScores: integer("exact_scores").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStandingsHistorySchema = createInsertSchema(
  standingsHistoryTable
).omit({
  id: true,
  createdAt: true,
});

export type InsertStandingsHistory = z.infer<typeof insertStandingsHistorySchema>;
export type StandingsHistory = typeof standingsHistoryTable.$inferSelect;
