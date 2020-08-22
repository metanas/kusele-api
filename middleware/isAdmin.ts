import { MiddlewareFn } from "type-graphql";
import { AuthenticationError } from "apollo-server-express";
import { ApiContext } from "../src/@types/ApiContext";
import { Admin } from "../src/entity/Admin";

export const isAdmin: MiddlewareFn<ApiContext> = async ({ context }, next): Promise<unknown> => {
  try {
    context.user = await Admin.findOneOrFail({
      where: {
        id: context.user?.id,
      },
    });
  } catch (e) {
    context.res.status(401);
    throw new AuthenticationError("Not Authorized");
  }

  return next();
};
