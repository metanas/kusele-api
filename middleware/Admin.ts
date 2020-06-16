import { MiddlewareFn } from "type-graphql";
import { AuthenticationError } from "apollo-server-express";
import { last } from "lodash";
import { redis } from "../src/utils/redis";
import { Admin } from "../src/entity/Admin";
import { ApiContext } from "../src/@types/ApiContext";

export const isAdmin: MiddlewareFn<ApiContext> = async ({ context }, next): Promise<unknown> => {
  const token = last(context.req?.headers?.authorization?.split(" "));

  const admin = JSON.parse(await redis.get(token)) as Admin;

  if (!admin?.id) {
    throw new AuthenticationError("Not Authenticated");
  }

  return next();
};
