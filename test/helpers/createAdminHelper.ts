import { Admin } from "../../src/entity/Admin";
import * as faker from "faker";
import { AdminGroup } from "../../src/entity/AdminGroup";
import { StateEnum } from "../../src/@types/StateEnum";
import { ElasticServiceTesting } from "../test-utils/ElasticService";

export async function createAdminHelper(group: AdminGroup, active = StateEnum.New, username?: string): Promise<Admin> {
  const admin = await Admin.create({
    username,
    email: faker.internet.email(),
    state: active,
    group,
  }).save();

  const elastic = new ElasticServiceTesting();

  await elastic.client.index({
    index: "admin",
    id: admin.id,
    body: admin,
    refresh: true,
  });

  elastic.close();

  return admin;
}
