import { Admin } from "../../src/entity/Admin";
import { sign } from "jsonwebtoken";
import * as dotenv from "dotenv";
import { redis } from "../../src/utils/redis";

dotenv.config();

export async function loginHelper(admin: Admin): Promise<string> {
  const adminString = JSON.stringify(admin);
  const token = await sign(adminString, process.env.ACCESS_TOKEN_SECRET);

  await redis.set(token, adminString);

  return token;
}
