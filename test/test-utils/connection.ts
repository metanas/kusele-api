import { Connection, createConnection } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();
export const connection = (drop = false): Promise<Connection> => {
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
