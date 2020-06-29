import { MiddlewareFn } from "type-graphql";
import { AuthenticationError } from "apollo-server-express";
import { ApiContext } from "../src/@types/ApiContext";
import { verify } from "jsonwebtoken";

export const isAdmin: MiddlewareFn<ApiContext> = async ({ context }, next): Promise<unknown> => {
  try {
    verify(context.req.headers?.authorization?.split(" ")[1], process.env.ACCESS_TOKEN_SECRET);
  } catch (e) {
    throw new AuthenticationError("Not Authorized");
  }

  return next();
};
