import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { notifications, onboardingStatus, rewardEvents, users } from "../../db/schema";
import { logger } from "../../lib/logger";
import { boss } from "../boss";
import { WELCOME_REWARD_QUEUE } from "../constants";

type WelcomeRewardJob = {
    userId: string;
};

// Registers worker that handles reward notification for its respective user after the time delay
export function registerWelcomeRewardWorker() {
    boss.work<WelcomeRewardJob>(WELCOME_REWARD_QUEUE, async ([job]) => {
        if (!job) return;

        const { userId } = job.data;
        logger.info({ jobId: job.id, userId }, "Processing welcome reward job");

        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (existingUser.length === 0) {
            logger.warn({ jobId: job.id, userId }, "User not found for reward job");
            return;
        }

        const onboarding = await db
            .select()
            .from(onboardingStatus)
            .where(
                and(
                    eq(onboardingStatus.userId, userId),
                    eq(onboardingStatus.completed, true)
                )
            )
            .limit(1);
        
        if (onboarding.length === 0) {
            await db.insert(rewardEvents).values({
                userId,
                eventType: "reward_notification_skipped",
                metadata: { reason: "onboarding_not_completed" },
            });

            logger.info({ jobId: job.id, userId }, "Skipped reward notification");
            return;
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
            await db.insert(rewardEvents).values({
                userId,
                eventType: "reward_notification_skipped",
                metadata: { reason: "notification_already_sent" },
            });

            logger.info({ jobId: job.id, userId }, "Reward notification already sent");
            return;
        }

        await db.insert(notifications).values({
            userId,
            type: "welcome_reward",
            title: "Welcome reward unlocked!",
            message: "Congratulations on completing onboarding! You've unlocked a welcome reward.",
        });

        await db.insert(rewardEvents).values({
            userId,
            eventType: "reward_notification_sent",
            metadata: { reward: "pg-boss" },
        });

        logger.info({ jobId: job.id, userId }, "Welcome reward notification sent");
    });
}