import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/request-logger.middleware.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", aiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
