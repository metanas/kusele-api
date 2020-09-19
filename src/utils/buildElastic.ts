import { ElasticService } from "./ElasticService";

export async function BuildElastic(elastic: ElasticService): Promise<void> {
  const admin = await elastic.client.indices.exists({ index: "admin" });

  if (!admin) {
    await elastic.client.indices.create({
      index: "admin",
    });
  }
}
