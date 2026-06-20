import express from "express";
import cors from "cors";
import aifoodRoutes from "./routes/aifood.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api", aifoodRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
