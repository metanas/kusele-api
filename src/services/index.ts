import { buildSchema } from "type-graphql";
import { join } from "path";
import { ApolloServer } from "apollo-server-express";
import { Container } from "typedi";
import { ElasticService } from "../utils/ElasticService";
import { Roles } from "../../middleware/Roles";

Container.set("elasticSearch", new ElasticService());

export const createApolloService = async (): Promise<ApolloServer> => {
  const schema = await buildSchema({
    resolvers: [join(__dirname, "../Resolvers/internal/**/*.Resolver.ts")],
    container: Container,
    authChecker: Roles,
  });

  return new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res }),
  });
};
