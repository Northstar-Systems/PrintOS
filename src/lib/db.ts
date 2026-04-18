import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.DB_HOST ?? "192.168.1.33",
  port: parseInt(process.env.DB_PORT ?? "65432"),
  database: process.env.DB_NAME ?? "printos",
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  max: 5,
  idleTimeoutMillis: 30000,
});
