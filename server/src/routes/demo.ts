import { Hono } from "hono";
import { like, eq } from "drizzle-orm";
import { db } from "../db";
import {
    users,
    onboardingStatus,
    notifications,
    rewardEvents,
} from "../db/schema";

const demoRouter = new Hono();

demoRouter.get("/users", async (c) => {
    const demoUsers = await db
        .select({
            id: users.id,
            email: users.email,
            name: users.name,
        })
        .from(users)
        .where(like(users.email, "demo%@example.com"));
    
    return c.json({
        ok: true,
        users: demoUsers,
    });
});

demoRouter.post("/reset/:userId", async (c) => {
    const userId = c.req.param("userId");

    const user = (
        await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
    )[0];

    if (!user) {
        return c.json(
            {
                ok: false,
                error: "User not found"
            },
            404
        );
    }

    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(rewardEvents).where(eq(rewardEvents.userId, userId));

    const existingOnboarding = await db
        .select()
        .from(onboardingStatus)
        .where(eq(onboardingStatus.userId, userId))
        .limit(1);
    
    if (existingOnboarding.length === 0) {
        await db.insert(onboardingStatus).values({
            userId,
            completed: false,
        });
    } else {
        await db
            .update(onboardingStatus)
            .set({
                completed: false,
                completedAt: null,
            })
            .where(eq(onboardingStatus.userId, userId));
    }

    return c.json({
        ok: true,
        message: `${user.name} reset successfully`
    });
});

export { demoRouter };