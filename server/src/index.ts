import "dotenv/config";
import { app } from "./app";
import { logger } from "./lib/logger";
import { registerJobs } from "./jobs/registerJobs";

const port = Number(process.env.PORT ?? 3000);

await registerJobs();

logger.info({ port }, "Server starting");

export default {
    port,
    fetch: app.fetch,
};