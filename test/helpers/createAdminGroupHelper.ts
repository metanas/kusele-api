import { AdminGroup } from "../../src/entity/AdminGroup";
import * as faker from "faker";

export async function createAdminGroupHelper(): Promise<AdminGroup> {
  return await AdminGroup.create({
    name: faker.name.jobTitle(),
    permissions: JSON.parse('{ "access": ["ADMIN"], "modify": ["ADMIN"] }'),
  }).save();
}
