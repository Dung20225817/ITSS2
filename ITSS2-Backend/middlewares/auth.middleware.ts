import { NextFunction, Request, Response } from "express";
import redis from "../config/redis";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "../helper/auth.helper";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice("Bearer ".length)
      : undefined;
    const token = cookieToken || bearer;

    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const payload = verifyAccessToken(token);
    const blacklisted = await redis
      .get(`auth:blacklist:access:${payload.jti}`)
      .catch(() => null);

    if (blacklisted) {
      res.status(401).json({ message: "Token has been logged out" });
      return;
    }

    (req as any).authUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
    };

    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
