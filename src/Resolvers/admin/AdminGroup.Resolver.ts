import { Arg, Args, Query, Resolver } from "type-graphql";
import { PaginatedAdminGroupResponse, PaginatedAdminGroupResponseType } from "../../@types/PaginatedResponseTypes";
import { PaginatedRequestArgs } from "../../modules/Args/PaginatedRequestArgs";
import { ceil, set } from "lodash";
import { AdminGroup } from "../../entity/AdminGroup";
import { FindManyOptions, Like } from "typeorm";

@Resolver()
export class AdminResolver {
  @Query(() => AdminGroup)
  public async getAdminGroup(@Arg("id") id: string): Promise<AdminGroup> {
    return await AdminGroup.findOne({ where: { id } });
  }

  @Query(() => PaginatedAdminGroupResponse)
  public async getAdminGroups(
    @Args() { name, limit, page }: PaginatedRequestArgs,
  ): Promise<PaginatedAdminGroupResponseType> {
    const options: FindManyOptions = { skip: (page - 1) * limit, take: limit, order: { create_at: "ASC" } };

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
}
