// eslint-disable-next-line @typescript-eslint/no-var-requires
const KuseleLogger = require("./middleware/KuseleLogger").default;

module.exports = {
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV !== "production" ? ["error"] : false,
  logger: new KuseleLogger(),
  entities: ["src/entity/**/*.ts"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
  cli: {
    entitiesDir: "src/entity",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber",
  },
};
