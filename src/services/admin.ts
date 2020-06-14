import { buildSchema } from "type-graphql";
import { join } from "path";
import { ApolloServer } from "apollo-server-express";
import { Container } from "typedi";
import { ElasticService } from "../utils/ElasticService";
import { ApiContext } from "../@types/ApiContext";

Container.set("elasticSearch", new ElasticService());

export const createApolloAdminService = async (): Promise<ApolloServer> => {
  const schema = await buildSchema({
    resolvers: [join(__dirname, "../Resolvers/admin/**/*.Resolver.ts")],
    nullableByDefault: true,
    container: Container,
  });

  return new ApolloServer({
    schema,
    context: ({ req, res }: ApiContext) => ({ req, res }),
  });
};
