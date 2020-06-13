import { AdminGroup } from "../../src/entity/AdminGroup";
import faker from "faker";

export async function createAdminGroupHelper(): Promise<AdminGroup> {
  return await AdminGroup.create({
    name: faker.name.jobTitle(),
    permissions: JSON.parse('{ "access": ["AddProduct", "test2"], "modify": ["Test3", "test4"] }'),
  }).save();
}
