import express, { Express } from "express";
import dotenv from "dotenv";
import * as database from "./config/database";
import mainRoutes from "./routes/index.routes";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

const parseCorsOrigins = (): string[] => {
  return (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const app: Express = express();
const port: string | number = process.env.PORT || 8080;
const corsOrigins = parseCorsOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes("*") || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

app.get("/healthz", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
  });
});

app.get("/readyz", async (_req, res) => {
  const connected = await database.isConnected();

  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "degraded",
  });
});

mainRoutes(app);

const start = async (): Promise<void> => {
  requireEnv("DATABASE_URL");
  requireEnv("JWT_ACCESS_SECRET");
  requireEnv("JWT_REFRESH_SECRET");

  await database.connect();

  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start app:", error);
  process.exit(1);
});
