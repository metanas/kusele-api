import { MiddlewareFn } from "type-graphql";
import { AuthenticationError } from "apollo-server-express";
import { redis } from "../src/utils/redis";
import { Admin } from "../src/entity/Admin";
import { ApiContext } from "../src/@types/ApiContext";

export const isAdmin: MiddlewareFn<ApiContext> = async ({ context }, next): Promise<unknown> => {
  if (!context.user?.id) {
    throw new AuthenticationError("Please Sign In To Continue This Action.");
  }

  const admin = JSON.parse(await redis.get(context.user.id)) as Admin;
  if (!admin?.id) {
    throw new AuthenticationError("Token expired");
  }

  return next();
};
