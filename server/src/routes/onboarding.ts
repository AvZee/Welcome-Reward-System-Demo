import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { onboardingStatus, rewardEvents } from "../db/schema";
import { boss } from "../jobs/boss";
import { WELCOME_REWARD_QUEUE } from "../jobs/constants";
import { logger } from "../lib/logger";

const onboardingRouter = new Hono();

const compleeteOnboardingSchema = z.object({
    userId: z.uuid(),
});

const rewardDelay = process.env.WELCOME_REWARD_DELAY ?? "5 minutes";

// Helper function to parse the rewardDelay value into milliseconds,
// supporting "second" and "minute" time units
function parseDelayMs(delay: string) {
    const [amountRaw, unitRaw] = delay.split(" ");
    const amount = Number(amountRaw);
    const unit = unitRaw?.toLowerCase();

    if (!Number.isFinite(amount)) {
        throw new Error("Invalid reward delay");
    }

    if (unit?.startsWith("second")) return amount * 1000;
    if (unit?.startsWith("minute")) return amount * 60000;

    throw new Error("Unsupported reward delay unit");
}

onboardingRouter.post("/complete", async (c) => {
    let body: unknown;

    try {
        body = await c.req.json();
    } catch {
        return c.json(
            {
                ok: false,
                error: "Request body must be a valid JSON",
            },
            400
        );
    }

    const result = compleeteOnboardingSchema.safeParse(body);

    if (!result.success) {
        return c.json(
            {
                ok: false,
                error: "Invalid request body",
                details: z.treeifyError(result.error),
            }, 
            400
        );
    }

    const { userId } = result.data;

    const existingOnboarding = (
        await db
            .select()
            .from(onboardingStatus)
            .where(eq(onboardingStatus.userId, userId))
            .limit(1)
    )[0];

    if (!existingOnboarding) {
        return c.json(
            {
                ok: false,
                error: "Onboarding record not found for this user",
            },
            404
        );
    }

    if (existingOnboarding.completed) {
        logger.info({ userId }, "Onboarding already completed");

        return c.json({
            ok: true,
            status: "already_completed",
            message: "Onboarding was already completed. No new reward job was scheduled.",
        });
    }

    await db
        .update(onboardingStatus)
        .set({ 
            completed: true,
            completedAt: new Date(),
        })
        .where(eq(onboardingStatus.userId, userId));

    await db.insert(rewardEvents).values({
        userId,
        eventType: "onboarding_completed",
        metadata: {},
    });

    const scheduledFor = new Date(Date.now() + parseDelayMs(rewardDelay));

    const jobId = await boss.send(
        WELCOME_REWARD_QUEUE,
        { userId },
        { startAfter: rewardDelay }
    );

    await db.insert(rewardEvents).values({
        userId,
        eventType: "reward_job_enqueued",
        metadata: { 
            jobId,
            delay: rewardDelay,
            scheduledFor: scheduledFor.toISOString(),
        },
    });

    logger.info(
        {
            userId,
            jobId,
            queue: WELCOME_REWARD_QUEUE,
            delay: rewardDelay
        },
        "Welcome reward job enqueued"
    );

    return c.json({
        ok: true,
        status: "scheduled",
        message: "Onboarding completed. Reward notification scheduled.",
        jobId,
        delay: rewardDelay,
        scheduledFor: scheduledFor.toISOString(),
    });
});

export { onboardingRouter };