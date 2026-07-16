import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { jornadasTable } from "./jornadas";
import { usersTable } from "./users";

export const matchupsTable = pgTable("matchups", {
  id: serial("id").primaryKey(),
  jornadaId: integer("jornada_id").notNull().references(() => jornadasTable.id, { onDelete: "cascade" }),
  player1Id: integer("player1_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  player2Id: integer("player2_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  player1Points: integer("player1_points"),
  player2Points: integer("player2_points"),
  player1MatchupPoints: integer("player1_matchup_points"),
  player2MatchupPoints: integer("player2_matchup_points"),
  result: text("result", { enum: ["player1_wins", "player2_wins", "draw"] }),
});

export const insertMatchupSchema = createInsertSchema(matchupsTable).omit({ id: true });
export type InsertMatchup = z.infer<typeof insertMatchupSchema>;
export type Matchup = typeof matchupsTable.$inferSelect;
