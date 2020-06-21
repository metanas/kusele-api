import { Arg, Args, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { PaginatedAdminGroupResponse, PaginatedAdminGroupResponseType } from "../../@types/PaginatedResponseTypes";
import { PaginatedRequestArgs } from "../../modules/Args/PaginatedRequestArgs";
import { ceil, set } from "lodash";
import { AdminGroup } from "../../entity/AdminGroup";
import { FindManyOptions, Like } from "typeorm";
import { isAdmin } from "../../../middleware/isAdmin";
import { AdminGroupArgs } from "../../modules/Args/adminGroupArgs";
import { Admin } from "../../entity/Admin";

@Resolver()
export class AdminResolver {
  @UseMiddleware(isAdmin)
  @Query(() => AdminGroup)
  public async getAdminGroup(@Arg("id") id: string): Promise<AdminGroup> {
    return await AdminGroup.findOne({ where: { id } });
  }

  @UseMiddleware(isAdmin)
  @Query(() => PaginatedAdminGroupResponse)
  public async getAdminGroups(
    @Args() { name, limit, page }: PaginatedRequestArgs,
  ): Promise<PaginatedAdminGroupResponseType> {
    const options: FindManyOptions = { skip: (page - 1) * limit, take: limit };

    if (name) {
      set(options, "where.name", Like(name));
    }

    const result = await AdminGroup.findAndCount(options);

    return {
      data: result[0],
      total_count: result[1],
      last_page: ceil(result[1] / limit),
    };
  }

  @UseMiddleware(isAdmin)
  @Mutation(() => AdminGroup)
  public async addAdminGroup(@Args() { name, access, modify }: AdminGroupArgs): Promise<AdminGroup> {
    return await AdminGroup.create({
      name,
      permissions: {
        access,
        modify,
      },
    }).save();
  }

  @UseMiddleware(isAdmin)
  @Mutation(() => AdminGroup)
  private async updateAdminGroup(
    @Arg("id") id: string,
    @Args() { name, access, modify }: AdminGroupArgs,
  ): Promise<AdminGroup> {
    await AdminGroup.createQueryBuilder()
      .update()
      .set({
        name,
        permissions: {
          access,
          modify,
        },
      })
      .where("id=:id", { id })
      .execute();

    return await AdminGroup.findOne({ where: { id } });
  }

  @UseMiddleware(isAdmin)
  @Mutation(() => Boolean)
  private async deleteAdminGroup(@Arg("id") id: string): Promise<boolean> {
    const group = await AdminGroup.findOne({ where: { id } });

    const admins = await Admin.count({ where: { group } });

    if (admins) {
      throw new Error("Group have relation with admin");
    }

    await group.remove();

    return true;
  }
}
