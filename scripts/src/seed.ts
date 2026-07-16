import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("Seeding database...");

  // Create users
  const adminHash = await bcrypt.hash("admin123", 10);
  const maestroHash = await bcrypt.hash("pincelin", 10);

  await pool.query(
    `INSERT INTO users (username, password_hash, display_name, role)
     VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
     ON CONFLICT (username) DO NOTHING`,
    ["admin", adminHash, "Administrador", "admin", "maestro", maestroHash, "Maestro Pincel", "player"]
  );
  console.log("Users created");

  // Create 17 jornadas
  const baseDate = new Date("2026-07-18T00:00:00Z");
  for (let i = 1; i <= 17; i++) {
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() + (i - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4);
    const status = i === 1 ? "active" : "upcoming";
    await pool.query(
      `INSERT INTO jornadas (number, name, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [i, `Jornada ${i}`, startDate.toISOString(), endDate.toISOString(), status]
    );
  }
  console.log("Jornadas created");

  // Get jornada 1 id
  const j1 = await pool.query(`SELECT id FROM jornadas WHERE number = 1`);
  const jornadaId = j1.rows[0]?.id;
  if (!jornadaId) { console.log("No jornada 1 found"); return; }

  // Create matches for Jornada 1 (Apertura 2026 sample fixtures)
  const matches = [
    { home: "América", away: "Cruz Azul", date: "2026-07-18T20:00:00Z", stadium: "Estadio Azteca" },
    { home: "Chivas", away: "Atlas", date: "2026-07-18T22:05:00Z", stadium: "Estadio Akron" },
    { home: "Tigres UANL", away: "Monterrey", date: "2026-07-19T18:00:00Z", stadium: "Estadio Universitario" },
    { home: "Toluca", away: "Pumas UNAM", date: "2026-07-19T20:00:00Z", stadium: "Estadio Nemesio Díez" },
    { home: "Santos Laguna", away: "León", date: "2026-07-19T22:05:00Z", stadium: "Estadio Corona" },
    { home: "Pachuca", away: "Puebla", date: "2026-07-20T18:00:00Z", stadium: "Estadio Hidalgo" },
    { home: "Necaxa", away: "Querétaro", date: "2026-07-20T20:00:00Z", stadium: "Estadio Victoria" },
    { home: "Mazatlán", away: "FC Juárez", date: "2026-07-20T21:00:00Z", stadium: "Estadio El Encanto" },
    { home: "Tijuana", away: "Atl. San Luis", date: "2026-07-21T21:00:00Z", stadium: "Estadio Caliente" },
  ];

  for (const m of matches) {
    await pool.query(
      `INSERT INTO matches (jornada_id, home_team, away_team, match_date, stadium)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [jornadaId, m.home, m.away, m.date, m.stadium]
    );
  }
  console.log("Matches for Jornada 1 created");

  // Create matches for jornadas 2-3 (without dates to show upcoming)
  const j2 = await pool.query(`SELECT id FROM jornadas WHERE number = 2`);
  const j2Id = j2.rows[0]?.id;
  if (j2Id) {
    const matches2 = [
      { home: "Cruz Azul", away: "Chivas", date: "2026-07-25T20:00:00Z", stadium: "Estadio Azteca" },
      { home: "Atlas", away: "América", date: "2026-07-25T22:05:00Z", stadium: "Estadio Jalisco" },
      { home: "Monterrey", away: "Toluca", date: "2026-07-26T20:00:00Z", stadium: "Estadio BBVA" },
      { home: "Pumas UNAM", away: "Santos Laguna", date: "2026-07-26T20:00:00Z", stadium: "Estadio Olímpico" },
      { home: "León", away: "Tigres UANL", date: "2026-07-26T22:05:00Z", stadium: "Estadio León" },
      { home: "Puebla", away: "Necaxa", date: "2026-07-27T18:00:00Z", stadium: "Estadio Cuauhtémoc" },
      { home: "Querétaro", away: "Pachuca", date: "2026-07-27T20:00:00Z", stadium: "Estadio Corregidora" },
      { home: "FC Juárez", away: "Mazatlán", date: "2026-07-27T21:00:00Z", stadium: "Estadio Olímpico Benito Juárez" },
      { home: "Atl. San Luis", away: "Tijuana", date: "2026-07-28T21:00:00Z", stadium: "Estadio Alfonso Lastras" },
    ];
    for (const m of matches2) {
      await pool.query(
        `INSERT INTO matches (jornada_id, home_team, away_team, match_date, stadium)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [j2Id, m.home, m.away, m.date, m.stadium]
      );
    }
    console.log("Matches for Jornada 2 created");
  }

  await pool.end();
  console.log("Seed complete!");
}

seed().catch(console.error);
