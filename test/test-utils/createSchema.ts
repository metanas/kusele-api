import { buildSchema } from "type-graphql";
import { join } from "path";
import { GraphQLSchema } from "graphql";
import { Container } from "typedi";
import { ElasticServiceTesting } from "./ElasticService";
import { Roles } from "../../middleware/Roles";
import { S3Mock } from "./S3Mock";
import { BuildElastic } from "../../src/utils/buildElastic";

const elastic = new ElasticServiceTesting();
Container.set("elasticSearch", elastic);
Container.set("S3", S3Mock);

export const createSchema = async (isAdmin = false): Promise<GraphQLSchema> => {
  await BuildElastic(elastic);

  return buildSchema({
    resolvers: [
      isAdmin
        ? join(__dirname + "/../../src/Resolvers/admin/*.ts")
        : join(__dirname + "/../../src/Resolvers/internal/*.ts"),
    ],
    nullableByDefault: true,
    container: Container,
    authChecker: Roles,
  });
};
