import { ElasticService } from "./ElasticService";
import { ElasticServiceTesting } from "../../test/test-utils/ElasticService";

export async function BuildElastic(elastic: ElasticService | ElasticServiceTesting): Promise<void> {
  const admin = await elastic.client.indices.exists({ index: "admin" });

  if (!admin) {
    await elastic.client.indices.create({
      index: "admin",
    });
  }

  const supplier = await elastic.client.indices.exists({ index: "supplier" });
  console.log(supplier.body);
  if (!supplier.body) {
    await elastic.client.indices.create({
      index: "supplier",
    });
  }
}
