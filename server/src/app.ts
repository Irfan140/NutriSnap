import { clerkMiddleware } from "@clerk/express";
import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";
import webhooksRoutes from "./routes/webhooks.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/request-logger.middleware.js";

const app = express();

app.use(cors());
// Svix verification needs the exact raw bytes, so the webhook route runs on
// express.raw() BEFORE the global JSON parser (body-parser skips consumed
// requests via the req._body flag, so this ordering is safe).
app.use("/api/webhooks", express.raw({ type: "application/json", limit: "1mb" }), webhooksRoutes);
app.use(express.json({ limit: "10mb" }));
app.use(requestLogger);
app.use(clerkMiddleware());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", aiRoutes);
app.use("/api", uploadsRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
