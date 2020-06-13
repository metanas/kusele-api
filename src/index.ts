import "reflect-metadata";
import { createConnection } from "typeorm";
import { createApolloService } from "./services";
import { InitService } from "./services/service";
import { createApolloAdminService } from "./services/admin";

const main = async (): Promise<void> => {
  await createConnection();

  const app = InitService();

  const apolloInternalService = await createApolloService();

  const apolloAdminService = await createApolloAdminService();

  apolloInternalService.applyMiddleware({
    app,
    path: "/api/graphql",
  });

  apolloAdminService.applyMiddleware({
    app,
    path: "/api/admin/graphql",
  });

  app.listen(4000, (): void => {
    console.log(`server started on http://www.localhost:4000${apolloInternalService.graphqlPath}`);
    console.log(`server started on http://www.localhost:4000${apolloAdminService.graphqlPath}`);
  });
};

main();
