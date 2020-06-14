import { Admin } from "../../src/entity/Admin";
import faker from "faker";
import { AdminGroup } from "../../src/entity/AdminGroup";
import { StateEnum } from "../../src/@types/StateEnum";
import { ElasticServiceTesting } from "../test-utils/ElasticService";

export async function createAdminHelper(group: AdminGroup, active = StateEnum.New): Promise<Admin> {
  const admin = await Admin.create({
    email: faker.internet.email(),
    state: active,
    group,
  }).save();

  const elastic = new ElasticServiceTesting();

  await elastic.client.index({
    index: "admin",
    id: admin.id,
    body: admin,
    refresh: "true",
  });

  elastic.close();

  return admin;
}
