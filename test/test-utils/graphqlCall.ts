import { graphql, GraphQLSchema } from "graphql";
import { createSchema } from "./createSchema";
import { ExecutionResult } from "graphql/execution/execute";

interface Options {
  source: string;
  isAdmin?: boolean;
}

let schema: GraphQLSchema;

export const graphqlCall = async ({ source, isAdmin }: Options): Promise<ExecutionResult> => {
  if (!schema) {
    schema = await createSchema(isAdmin);
  }

  return graphql({
    schema,
    source,
    contextValue: {
      res: {
        setHeader: jest.fn(),
      },
    },
  });
};
