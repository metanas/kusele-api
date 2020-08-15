import { AuthChecker } from "type-graphql";
import { ForbiddenError } from "apollo-server-errors";
import { ApiContext } from "../src/@types/ApiContext";
import { Admin } from "../src/entity/Admin";

export const Roles: AuthChecker<ApiContext> = async ({ context }, roles: string[]): Promise<boolean> => {
  const admin = await Admin.findOne({ where: { id: context.user.id }, relations: ["group"] });

  if (admin?.group?.permissions.includes(roles[0])) {
    context.user = admin;
    return true;
  }

  context.res.status(401);

  throw new ForbiddenError("You don't have Authorization");
};
