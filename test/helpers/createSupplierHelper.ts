import { StateEnum } from "../../src/@types/StateEnum";
import { Admin } from "../../src/entity/Admin";
import * as faker from "faker";
import { ElasticServiceTesting } from "../test-utils/ElasticService";
import Supplier from "../../src/entity/Supplier";

export async function createSupplierHelper(admin: Admin, active = StateEnum.New): Promise<Supplier> {
  const supplier = await Supplier.create({
    last_name: faker.name.lastName(),
    first_name: faker.name.firstName(),
    email: faker.internet.email(),
    state: active,
  }).save();

  const elastic = new ElasticServiceTesting();

  await elastic.client.index({
    index: "supplier",
    id: supplier.id,
    body: supplier,
    refresh: true,
  });

  elastic.close();

  return supplier;
}
