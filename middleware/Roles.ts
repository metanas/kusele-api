import { AuthChecker } from "type-graphql";
import { ForbiddenError } from "apollo-server-errors";
import { ApiContext } from "../src/@types/ApiContext";

export const Roles: AuthChecker<ApiContext> = async ({ context, info }, roles: string[]): Promise<boolean> => {
  if (context.user) {
    if (info.parentType.toString() === "Query" && context.user?.group.permissions.access.includes(roles[0])) {
      return true;
    }

    if (info.parentType.toString() === "Mutation" && context.user?.group?.permissions.modify.includes(roles[0])) {
      return true;
    }
  }

  throw new ForbiddenError("You don't have Authorization");
};
