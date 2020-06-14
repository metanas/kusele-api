import { Connection } from "typeorm";
import { ElasticServiceTesting } from "../test-utils/ElasticService";

export async function truncate(conn: Connection, table: string): Promise<void> {
  await conn.query(`TRUNCATE "${table}" CASCADE`);

  const elastic = new ElasticServiceTesting();

  await elastic.client.indices.delete({
    index: table,
  });

  elastic.close();
}
