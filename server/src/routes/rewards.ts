import { Hono } from "hono";
import { and, eq, desc } from "drizzle-orm";
import { db } from "../db";
import { onboardingStatus, notifications, rewardEvents } from "../db/schema";

const rewardsRouter = new Hono();

rewardsRouter.get("/status/:userId", async (c) => {
    const userId = c.req.param("userId");

    const onboarding = await db
        .select()
        .from(onboardingStatus)
        .where(eq(onboardingStatus.userId, userId))
        .limit(1);
    
    if (onboarding.length === 0 || !onboarding[0]?.completed) {
        return c.json({ ok: true, status: "not_started" });
    }

    const existingNotification = await db
        .select()
        .from(notifications)
        .where(
            and(
                eq(notifications.userId, userId),
                eq(notifications.type, "welcome_reward")
            )
        )
        .limit(1);

    if (existingNotification.length > 0) {
        return c.json({ ok: true, status: "sent" });
    }

    return c.json({ ok: true, status: "scheduled" });
});

rewardsRouter.get("/events/:userId", async (c) => {
    const userId = c.req.param("userId");

    const events = await db
        .select()
        .from(rewardEvents)
        .where(eq(rewardEvents.userId, userId))
        .orderBy(desc(rewardEvents.createdAt));

    return c.json({ ok: true, events });
});

export { rewardsRouter };