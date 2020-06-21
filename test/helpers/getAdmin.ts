import { Admin } from "../../src/entity/Admin";

export async function getAdmin(id: string): Promise<Admin> {
  return Admin.findOne({ where: { id } });
}
