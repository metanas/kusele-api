module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  collectCoverage: true,
  collectCoverageFrom: ["src/Resolvers/**/*.ts"],
};
