import { pgTable, serial, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { matchesTable } from "./matches";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  matchId: integer("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  points: integer("points"),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  unique().on(t.userId, t.matchId),
]);

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
