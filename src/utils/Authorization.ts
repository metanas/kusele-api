import { sign } from "jsonwebtoken";

export const createAccessToken = (admin: Record<string, string>): string =>
  sign({ id: admin.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

export const createRefreshToken = (admin: { id: string; version: number }): string =>
  sign({ id: admin.id, version: admin.version }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "30d" });
