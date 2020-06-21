import { Admin } from "../../src/entity/Admin";
import { sign } from "jsonwebtoken";
import * as dotenv from "dotenv";
import { redis } from "../../src/utils/redis";

dotenv.config();

export async function loginHelper(admin: Admin): Promise<string> {
  const adminJson = JSON.stringify(admin);
  const token = await sign(adminJson, process.env.ACCESS_TOKEN_SECRET);

  await redis.set(admin.id, adminJson);

  return token;
}
