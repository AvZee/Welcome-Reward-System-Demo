import { Hono } from "hono";

export const healthRouter = new Hono();

healthRouter.get("/", (c) => {
    return c.json({
        ok: true,
        service: "welcome-reward-api",
    });
});