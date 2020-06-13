import { Connection } from "typeorm";

export async function truncate(conn: Connection, table: string): Promise<void> {
  await conn.query(`TRUNCATE "${table}" CASCADE`);
}
