import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { PaginatedAdminGroupResponse, PaginatedAdminGroupResponseType } from "../../@types/PaginatedResponseTypes";
import { PaginatedRequestArgsBase } from "../../modules/Args/PaginatedRequestArgsBase";
import { ceil, set } from "lodash";
import { AdminGroup } from "../../entity/AdminGroup";
import { FindManyOptions, Like } from "typeorm";
import { AdminGroupArgs } from "../../modules/Args/adminGroupArgs";
import { Admin } from "../../entity/Admin";
import Permissions from "../../utils/permissions.json";
import { ApiContext } from "../../@types/ApiContext";
import { HistoryAdminAction } from "../../entity/HistoryAdminAction";

@Resolver()
export class AdminGroupResolver {
  @Authorized("AdminGroup/getPermissions")
  @Query(() => [String])
  private async getPermissions(): Promise<string[]> {
    return Permissions;
  }

  @Authorized("AdminGroup/getAdminGroup")
  @Query(() => AdminGroup)
  public async getAdminGroup(@Arg("id") id: number): Promise<AdminGroup> {
    return await AdminGroup.findOne({ where: { id } });
  }

  @Authorized("AdminGroup/getAdminGroups")
  @Query(() => PaginatedAdminGroupResponse)
  public async getAdminGroups(
    @Args() { name, limit, page }: PaginatedRequestArgsBase,
  ): Promise<PaginatedAdminGroupResponseType> {
    const options: FindManyOptions = { skip: (page - 1) * limit, take: limit, order: { id: "ASC" } };

    if (name) {
      set(options, "where.name", Like(`${name}%`));
    }

    const result = await AdminGroup.findAndCount(options);

    return {
      data: result[0],
      total_count: result[1],
      last_page: ceil(result[1] / limit),
    };
  }

  @Authorized("AdminGroup/addAdminGroup")
  @Mutation(() => AdminGroup)
  public async addAdminGroup(@Args() { name, permissions }: AdminGroupArgs): Promise<AdminGroup> {
    return await AdminGroup.create({
      name,
      permissions,
    }).save();
  }

  @Authorized("AdminGroup/updateAdminGroup")
  @Mutation(() => AdminGroup)
  private async updateAdminGroup(
    @Ctx() ctx: ApiContext,
    @Arg("id", { nullable: false }) id: number,
    @Args() { name, permissions }: AdminGroupArgs,
  ): Promise<AdminGroup> {
    await AdminGroup.createQueryBuilder()
      .update()
      .set({
        name,
        permissions,
        updated_by: ctx.user,
      })
      .where("id=:id", { id })
      .execute();

    return await AdminGroup.findOne({ where: { id } });
  }

  @Authorized("AdminGroup/deleteAdminGroup")
  @Mutation(() => Boolean)
  private async deleteAdminGroup(@Ctx() ctx: ApiContext, @Arg("id") id: number): Promise<boolean> {
    const group = await AdminGroup.findOne({ where: { id } });

    const admins = await Admin.count({ where: { group } });

    if (admins) {
      throw new Error("Group have relation with admin");
    }

    await group.remove();

    const admin = await Admin.findOne({ where: { id: ctx.user.id } });

    await HistoryAdminAction.create({
      type_action: "DELETE",
      creator: admin,
      data: `DELETE FROM admin_group where id=$1 params => [${id}]`,
      table_name: "admin_group",
    }).save();

    return true;
  }
}
