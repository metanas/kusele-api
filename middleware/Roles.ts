import { AuthChecker } from "type-graphql";
import { ForbiddenError } from "apollo-server-errors";
import { ApiContext } from "../src/@types/ApiContext";
import { Admin } from "../src/entity/Admin";

export const Roles: AuthChecker<ApiContext> = async ({ context, info }, roles: string[]): Promise<boolean> => {
  const admin = await Admin.findOne({ where: { id: context.user.id }, relations: ["group"] });

  if (admin && info.parentType.toString() === "Query" && admin.group?.permissions.access.includes(roles[0])) {
    return true;
  }

  if (admin && info.parentType.toString() === "Mutation" && admin.group?.permissions.modify.includes(roles[0])) {
    return true;
  }

  context.res.status(401);

  throw new ForbiddenError("You don't have Authorization");
};
