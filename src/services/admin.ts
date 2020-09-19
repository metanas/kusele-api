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
import { SchemaDirectiveVisitor } from "graphql-tools";
import DeprecatedDirective from "./Directives/DeprecatedDirective";
import InternationalizationDirective from "./Directives/InternationalizationDirective";
import { BuildElastic } from "../utils/buildElastic";

const elasticSearch = new ElasticService();
Container.set("elasticSearch", elasticSearch);
Container.set("S3", new AwsS3());

export const createApolloAdminService = async (): Promise<ApolloServer> => {
  const schema = await buildSchema({
    resolvers: [join(__dirname, "../Resolvers/admin/**/*.Resolver.ts")],
    nullableByDefault: true,
    authChecker: Roles,
    container: Container,
  });

  await BuildElastic(elasticSearch);

  SchemaDirectiveVisitor.visitSchemaDirectives(schema, { deprecated: DeprecatedDirective });
  SchemaDirectiveVisitor.visitSchemaDirectives(schema, { inter: InternationalizationDirective });

  return new ApolloServer({
    schema,
    uploads: false,
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
