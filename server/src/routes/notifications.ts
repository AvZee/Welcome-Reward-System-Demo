import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "../db/schema";

const notificationsRouter = new Hono();

notificationsRouter.get("/:userId", async (c) => {
    const userId = c.req.param("userId");

    const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId));

    return c.json({
        ok: true,
        notifications: rows,
    });
});

export { notificationsRouter };