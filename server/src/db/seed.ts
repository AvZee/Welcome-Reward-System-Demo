import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { 
    users,
    onboardingStatus,
    notifications,
    rewardEvents,
} from "./schema";
import { logger } from "../lib/logger";

const demoUsers = [
    { email: "demo1@example.com", name: "Demo User 1" },
    { email: "demo2@example.com", name: "Demo User 2" },
    { email: "demo3@example.com", name: "Demo User 3" },
];

// Creates entries or resets onboarding status for each demo user
// Users' notifications and reward events are also deleted as part of the reset
// Maintains idempotency for each seed
async function seed() {
    for (const demoUser of demoUsers) {
        let user = (
            await db
                .select()
                .from(users)
                .where(eq(users.email, demoUser.email))
                .limit(1)
        )[0];

        if (!user) {
            user = (
                await db
                    .insert(users)
                    .values(demoUser)
                    .returning()
            )[0];

            if (!user) throw new Error(`Failed to create ${demoUser.email}`);
        }
        
        await db.delete(users).where(eq(users.email, "demo@example.com"));
        await db.delete(notifications).where(eq(notifications.userId, user.id));
        await db.delete(rewardEvents).where(eq(rewardEvents.userId, user.id));

        const existingOnboarding = await db
            .select()
            .from(onboardingStatus)
            .where(eq(onboardingStatus.userId, user.id))
            .limit(1);

            if (existingOnboarding.length === 0) {
                await db.insert(onboardingStatus).values({
                    userId: user.id,
                    completed: false,
                });
            } else {
                await db
                    .update(onboardingStatus)
                    .set({
                        completed: false,
                        completedAt: null,
                    })
                    .where(eq(onboardingStatus.userId, user.id));
            }

        logger.info({ user }, "Demo user ready");
    }
}

seed()
    .catch((err) => {
        logger.error({ err }, "Seed failed");
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });