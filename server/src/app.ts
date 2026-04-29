import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "./lib/logger";
import { healthRouter } from "./routes/health";
import { onboardingRouter } from "./routes/onboarding";
import { notificationsRouter } from "./routes/notifications";
import { rewardsRouter } from "./routes/rewards";
import { demoRouter } from "./routes/demo";

export const app = new Hono();

app.use(
    "/api/*",
    cors({
        origin: [
            "http://localhost:5173",
            "https://welcome-reward-system-demo.vercel.app",
        ],
        allowMethods: ["GET", "PATCH", "OPTIONS"],
        allowHeaders: ["Content-Type"],
    })
);

app.get("/", (c) => {
    return c.json({
        ok: true,
        name: "Welcome Reward Backend",
    });
});

app.route("/api/health", healthRouter);
app.route("/api/onboarding", onboardingRouter);
app.route("/api/notifications", notificationsRouter);
app.route("/api/rewards", rewardsRouter);
app.route("/api/demo", demoRouter);

app.notFound((c) => {
    return c.json(
        {
            ok: false,
            error: "Route not found",
        },
        404
    );
});

// Global error handler for unhandled exceptions, logs the error and returns a 500 response
app.onError((err, c) => {
    logger.error({ err }, "Unhandled application error");

    return c.json(
        {
            ok: false,
            error: "Internal server error",
        },
        500
    );
});