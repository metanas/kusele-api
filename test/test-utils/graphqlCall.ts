import { graphql, GraphQLSchema } from "graphql";
import { createSchema } from "./createSchema";
import { ExecutionResult } from "graphql/execution/execute";
import { Admin } from "../../src/entity/Admin";

interface Options {
  source: string;
  isAdmin?: boolean;
  token?: string;
  admin?: Admin;
}

let schema: GraphQLSchema;

export const graphqlCall = async ({ source, isAdmin, token, admin }: Options): Promise<ExecutionResult> => {
  if (!schema) {
    schema = await createSchema(isAdmin);
  }

  return graphql({
    schema,
    source,
    contextValue: {
      req: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
      res: {
        setHeader: jest.fn(),
        cookie: jest.fn(),
      },
      user: admin,
    },
  });
};
