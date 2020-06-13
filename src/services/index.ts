import { buildSchema } from "type-graphql";
import { join } from "path";
import { ApolloServer } from "apollo-server-express";
import { Container } from "typedi";
import { ElasticService } from "../utils/ElasticService";

Container.set("elasticSearch", new ElasticService());

export const createApolloService = async (): Promise<ApolloServer> => {
  const schema = await buildSchema({
    resolvers: [join(__dirname, "../Resolvers/internal/**/*.Resolver.ts")],
    container: Container,
  });

  return new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res }),
  });
};
