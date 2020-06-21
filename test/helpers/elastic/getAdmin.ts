import { ElasticServiceTesting } from "../../test-utils/ElasticService";

export async function getAdminElastic(id: string): Promise<unknown> {
  const elastic = new ElasticServiceTesting();

  const { body } = await elastic.client.getSource({
    index: "admin",
    id,
  });

  elastic.close();

  return body;
}
