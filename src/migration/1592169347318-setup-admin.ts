import { MigrationInterface, QueryRunner } from "typeorm";
import { Admin } from "../entity/Admin";
import { AdminGroup } from "../entity/AdminGroup";
import { StateEnum } from "../@types/StateEnum";
import { ElasticService } from "../utils/ElasticService";
import { hash } from "bcryptjs";

export class setupAdmin1592169347318 implements MigrationInterface {
  client = new ElasticService().client;

  public async up(): Promise<void> {
    const group = await AdminGroup.create({
      name: "administrator",
      permissions: {
        access: [],
        modify: [],
      },
    }).save();
    const admin = await Admin.create({
      email: "admin@kusele.com",
      username: "admin",
      password: await hash("superroot", 12),
      state: StateEnum.Enabled,
      group,
    }).save();
    this.client.index({
      index: "admin",
      id: admin.id,
      body: admin,
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("TRUNCATE admin RESTART IDENTITY CASCADE");
    await queryRunner.query("TRUNCATE admin_group RESTART IDENTITY CASCADE");
    this.client.indices.delete({
      index: "admin",
    });
  }
}
