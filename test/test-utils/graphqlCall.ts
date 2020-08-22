import { graphql, GraphQLSchema } from "graphql";
import { createSchema } from "./createSchema";
import { ExecutionResult } from "graphql/execution/execute";
import { Admin } from "../../src/entity/Admin";
import { Maybe } from "type-graphql";

interface Options {
  source: string;
  value?: Maybe<{ [key: string]: unknown }>;
  isAdmin?: boolean;
  token?: string;
  jid?: string;
  admin?: Admin;
}

let schema: GraphQLSchema;

export const graphqlCall = async ({ source, value, isAdmin, token, jid, admin }: Options): Promise<ExecutionResult> => {
  if (!schema) {
    schema = await createSchema(isAdmin);
  }

  return graphql({
    schema,
    source,
    variableValues: value || undefined,
    contextValue: {
      req: {
        headers: {
          authorization: `Bearer ${token}`,
        },
        cookies: {
          jid,
        },
      },
      res: {
        status: jest.fn(),
        setHeader: jest.fn(),
        cookie: jest.fn(),
        set: jest.fn(),
      },
      user: admin,
    },
  });
};
