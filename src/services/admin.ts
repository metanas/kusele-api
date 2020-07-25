import { buildSchema } from "type-graphql";
import { join } from "path";
import { ApolloServer } from "apollo-server-express";
import { Container } from "typedi";
import { ElasticService } from "../utils/ElasticService";
import { ApiContext } from "../@types/ApiContext";
import { last, set } from "lodash";
import { verify } from "jsonwebtoken";
import { Roles } from "../../middleware/Roles";
import { AwsS3 } from "../utils/AwsS3";

Container.set("elasticSearch", new ElasticService());
Container.set("S3", new AwsS3());

export const createApolloAdminService = async (): Promise<ApolloServer> => {
  const schema = await buildSchema({
    resolvers: [join(__dirname, "../Resolvers/admin/**/*.Resolver.ts")],
    nullableByDefault: true,
    authChecker: Roles,
    container: Container,
  });

  return new ApolloServer({
    schema,
    uploads: { maxFileSize: 10000000, maxFiles: 10 },
    context: async ({ req, res }: ApiContext) => {
      const ctx = { req, res };
      const token = last(req.headers?.authorization?.split(" "));

      if (token) {
        try {
          set(ctx, "user", verify(token, process.env.ACCESS_TOKEN_SECRET));
        } catch (e) {}
      }

      return ctx;
    },
  });
};
