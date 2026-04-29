import { boss } from "./boss";
import { WELCOME_REWARD_QUEUE } from "./constants";
import { logger } from "../lib/logger";
import { registerWelcomeRewardWorker } from "./workers/welcomeRewardWorker";

export async function registerJobs() {
    await boss.start();
    await boss.createQueue(WELCOME_REWARD_QUEUE);
    registerWelcomeRewardWorker();
    logger.info({ queue: WELCOME_REWARD_QUEUE}, "Job system registered");
}