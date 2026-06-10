import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Response } from "express";

type TokenUser = {
  id: string;
  email: string;
  role: string;
};

export type AccessTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  role: string;
  type: "access";
  jti: string;
};

export type RefreshTokenPayload = JwtPayload & {
  sub: string;
  type: "refresh";
  jti: string;
};

export const ACCESS_COOKIE_NAME = "accessToken";
export const REFRESH_COOKIE_NAME = "refreshToken";

const envInt = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const accessTokenTtlSeconds = (): number =>
  envInt("ACCESS_TOKEN_TTL_SECONDS", 15 * 60);

export const refreshTokenTtlSeconds = (): number =>
  envInt("REFRESH_TOKEN_TTL_SECONDS", 7 * 24 * 60 * 60);

const accessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is required");
  return secret;
};

const refreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is required");
  return secret;
};

const cookieSecure = (): boolean => process.env.COOKIE_SECURE === "true";

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const signAccessToken = (user: TokenUser): string => {
  return jwt.sign(
    {
      email: user.email,
      role: user.role,
      type: "access",
    },
    accessSecret(),
    {
      subject: user.id,
      jwtid: crypto.randomUUID(),
      expiresIn: accessTokenTtlSeconds(),
    }
  );
};

export const signRefreshToken = (userId: string): string => {
  return jwt.sign(
    {
      type: "refresh",
    },
    refreshSecret(),
    {
      subject: userId,
      jwtid: crypto.randomUUID(),
      expiresIn: refreshTokenTtlSeconds(),
    }
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, accessSecret()) as AccessTokenPayload;
  if (payload.type !== "access" || !payload.sub || !payload.jti) {
    throw new Error("Invalid access token");
  }
  return payload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const payload = jwt.verify(token, refreshSecret()) as RefreshTokenPayload;
  if (payload.type !== "refresh" || !payload.sub || !payload.jti) {
    throw new Error("Invalid refresh token");
  }
  return payload;
};

export const decodedAccessTokenTtl = (
  token: string
): { jti?: string; ttl: number } => {
  const decoded = jwt.decode(token) as JwtPayload | null;
  if (!decoded?.exp) return { ttl: 0 };

  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  return {
    jti: typeof decoded.jti === "string" ? decoded.jti : undefined,
    ttl: Math.max(ttl, 0),
  };
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: accessTokenTtlSeconds() * 1000,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: refreshTokenTtlSeconds() * 1000,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_COOKIE_NAME, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
  });

  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/api/v1/auth",
  });
};
