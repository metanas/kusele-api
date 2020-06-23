import { Admin } from "../../src/entity/Admin";
import { sign } from "jsonwebtoken";
import * as dotenv from "dotenv";

dotenv.config();

export async function loginHelper(admin: Admin): Promise<string> {
  return sign({ ...admin }, process.env.ACCESS_TOKEN_SECRET);
}
