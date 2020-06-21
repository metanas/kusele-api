import { Connection } from "typeorm";
import { ElasticServiceTesting } from "../test-utils/ElasticService";

export async function truncate(conn: Connection, table: string, ignoreElastic = false): Promise<void> {
  await conn.query(`TRUNCATE "${table}" CASCADE`);

  if (!ignoreElastic) {
    const elastic = new ElasticServiceTesting();

    await elastic.client.indices.delete({
      index: table,
    });

    elastic.close();
  }
}
