module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  moduleNameMapper: {
    "^.+.(png)$": "jest-transform-stub",
  },
  collectCoverage: true,
  collectCoverageFrom: ["src/Resolvers/**/*.ts"],
  testTimeout: 20000,
};
