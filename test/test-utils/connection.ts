import { Connection, createConnection } from "typeorm";
import * as dotenv from "dotenv";
import { BuildElastic } from "../../src/utils/buildElastic";
import { ElasticServiceTesting } from "./ElasticService";

dotenv.config();
export const connection = async (drop = false): Promise<Connection> => {
  const elastic = new ElasticServiceTesting();
  await BuildElastic(elastic);
  await elastic.client.close();

  return createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: process.env.DB_USERNAME,
    database: process.env.DB_TESTING,
    password: process.env.DB_PASSWORD,
    synchronize: drop,
    dropSchema: drop,
    logging: "all",
    logger: "file",
    entities: [__dirname + "/../../src/entity/*.ts"],
    cli: {
      entitiesDir: "/../../src/entity/*.ts",
    },
  });
};
