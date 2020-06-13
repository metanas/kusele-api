import { Admin } from "../../src/entity/Admin";
import faker from "faker";
import { AdminGroup } from "../../src/entity/AdminGroup";
import { StateEnum } from "../../src/@types/StateEnum";

export async function createAdminHelper(group: AdminGroup, password?: string, active = true): Promise<Admin> {
  password = password ? password : faker.lorem.word();
  return await Admin.create({
    username: [faker.name.firstName(), faker.name.lastName()].join(" "),
    email: faker.internet.email(),
    password,
    state: active ? StateEnum.Enabled : StateEnum.New,
    group,
  }).save();
}
