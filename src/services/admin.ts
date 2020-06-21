import { buildSchema } from "type-graphql";
import { join } from "path";
import { ApolloServer } from "apollo-server-express";
import { Container } from "typedi";
import { ElasticService } from "../utils/ElasticService";
import { ApiContext } from "../@types/ApiContext";
import { last, set } from "lodash";
import { verify } from "jsonwebtoken";
import { Roles } from "../../middleware/Roles";

Container.set("elasticSearch", new ElasticService());

export const createApolloAdminService = async (): Promise<ApolloServer> => {
  const schema = await buildSchema({
    resolvers: [join(__dirname, "../Resolvers/admin/**/*.Resolver.ts")],
    nullableByDefault: true,
    authChecker: Roles,
    container: Container,
  });

  return new ApolloServer({
    schema,
    context: async ({ req, res }: ApiContext) => {
      const ctx = { req, res };
      const token = last(req.headers?.authorization?.split(" "));

      if (token) {
        set(ctx, "user", verify(token, process.env.ACCESS_TOKEN_SECRET));
      }

      return ctx;
    },
  });
};
