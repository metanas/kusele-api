import { graphql, GraphQLSchema } from "graphql";
import { createSchema } from "./createSchema";
import { ExecutionResult } from "graphql/execution/execute";
import { redis } from "../../src/utils/redis";

interface Options {
  source: string;
  isAdmin?: boolean;
  token?: string;
}

let schema: GraphQLSchema;

export const graphqlCall = async ({ source, isAdmin, token }: Options): Promise<ExecutionResult> => {
  if (!schema) {
    schema = await createSchema(isAdmin);
  }

  const user = JSON.parse(await redis.get(token));

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
      },
      user,
    },
  });
};
