import { buildSchema } from "type-graphql";
import { join } from "path";
import { GraphQLSchema } from "graphql";
import { Container } from "typedi";
import { ElasticServiceTesting } from "./ElasticService";

Container.set("elasticSearch", new ElasticServiceTesting());

export const createSchema = (isAdmin = false): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [
      isAdmin
        ? join(__dirname + "/../../src/Resolvers/admin/*.ts")
        : join(__dirname + "/../../src/Resolvers/internal/*.ts"),
    ],
    nullableByDefault: true,
    container: Container,
  });
};
