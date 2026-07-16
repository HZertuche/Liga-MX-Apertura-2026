import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { jornadasTable } from "./jornadas";

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  jornadaId: integer("jornada_id").notNull().references(() => jornadasTable.id, { onDelete: "cascade" }),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeTeamLogo: text("home_team_logo"),
  awayTeamLogo: text("away_team_logo"),
  matchDate: timestamp("match_date"),
  stadium: text("stadium"),
  status: text("status", { enum: ["pending", "live", "finished"] }).notNull().default("pending"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  isLocked: boolean("is_locked").notNull().default(false),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;
