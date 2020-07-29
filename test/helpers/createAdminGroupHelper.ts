import { AdminGroup } from "../../src/entity/AdminGroup";
import * as faker from "faker";
import permissions from "../../src/utils/permissions.json";

export async function createAdminGroupHelper(): Promise<AdminGroup> {
  return await AdminGroup.create({
    name: faker.name.jobTitle(),
    permissions: permissions,
  }).save();
}
