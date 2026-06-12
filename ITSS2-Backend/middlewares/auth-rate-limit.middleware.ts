import { NextFunction, Request, Response } from "express";
import redis from "../config/redis";

const envInt = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const windowSeconds = (): number =>
  envInt("AUTH_RATE_LIMIT_WINDOW_SECONDS", 15 * 60);

const ipLimit = (): number => envInt("AUTH_IP_RATE_LIMIT", 20);
const emailLimit = (): number => envInt("AUTH_EMAIL_RATE_LIMIT", 5);

const normalizeEmail = (email: unknown): string | null => {
  if (typeof email !== "string") return null;
  const value = email.trim().toLowerCase();
  return value || null;
};

const requestIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
};

const checkLimit = async (
  key: string,
  limit: number
): Promise<{ allowed: boolean; retryAfter: number }> => {
  try {
    const redisKey = `auth:rate:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSeconds());
    }

    if (count <= limit) {
      return { allowed: true, retryAfter: 0 };
    }

    const ttl = await redis.ttl(redisKey);
    return { allowed: false, retryAfter: Math.max(ttl, 1) };
  } catch (error) {
    console.warn("Auth rate limit skipped:", (error as Error).message);
    return { allowed: true, retryAfter: 0 };
  }
};

export const authRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = requestIp(req);
  const email = normalizeEmail(req.body?.email);

  const ipResult = await checkLimit(`ip:${ip}`, ipLimit());
  if (!ipResult.allowed) {
    res.setHeader("Retry-After", String(ipResult.retryAfter));
    res.status(429).json({ message: "Too many auth requests from this IP" });
    return;
  }

  if (email) {
    const emailResult = await checkLimit(`email:${email}`, emailLimit());
    if (!emailResult.allowed) {
      res.setHeader("Retry-After", String(emailResult.retryAfter));
      res.status(429).json({ message: "Too many auth requests for this email" });
      return;
    }
  }

  next();
};
