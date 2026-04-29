import  "dotenv/config";
import { PgBoss } from "pg-boss";
import { logger } from "../lib/logger";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

export const boss = new PgBoss(connectionString);

boss.on("error", (error) => {
    logger.error({ err: error }, "pg-boss error");
});