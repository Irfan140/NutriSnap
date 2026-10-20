import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.lib.js";
import aiRoutes from "./routes/meal-analysis.routes.js";
import accountRoutes from "./routes/account.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middlewares.js";
import { requestLogger } from "./middlewares/request-logger.middlewares.js";

const app = express();

app.use(cors());
// Better Auth must read the raw request stream itself, so its handler mounts
// BEFORE the global JSON parser (body parsers consume the stream).
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json({ limit: "10mb" }));
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", aiRoutes);
app.use("/api", uploadsRoutes);
app.use("/api", accountRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
