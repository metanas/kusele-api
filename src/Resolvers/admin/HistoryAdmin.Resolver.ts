import { Arg, Args, Authorized, Query, Resolver } from "type-graphql";
import { HistoryAdminAction } from "../../entity/HistoryAdminAction";
import { PaginatedRequestArgsBase } from "../../modules/Args/PaginatedRequestArgsBase";
import { PaginatedHistoryResponse, PaginatedHistoryResponseType } from "../../@types/PaginatedResponseTypes";
import { FindManyOptions } from "typeorm/find-options/FindManyOptions";
import { ceil, set } from "lodash";
import { Like } from "typeorm";
import { Admin } from "../../entity/Admin";

@Resolver()
export class HistoryAdminResolver {
  @Authorized("HistoryAdmin/getHistory")
  @Query(() => PaginatedHistoryResponse)
  public async getHistory(
    @Arg("table", { nullable: true }) table: string,
    @Arg("type", { nullable: true }) type_action: string,
    @Arg("admin_id", { nullable: true }) admin_id: string,
    @Args() { page, limit }: PaginatedRequestArgsBase,
  ): Promise<PaginatedHistoryResponseType> {
    const params: FindManyOptions = {
      skip: limit * (page - 1),
      take: limit,
      order: {
        created_at: "DESC",
      },
    };

    if (admin_id) {
      const admin = await Admin.findOne({ where: { id: admin_id } });
      set(params, "where.creator", admin);
    }

    if (table) {
      set(params, "where.table_name", Like(`%${table}%`));
    }

    if (type_action) {
      set(params, "where.type_action", type_action.toUpperCase());
    }

    const data = await HistoryAdminAction.findAndCount(params);

    return {
      data: data[0],
      last_page: ceil(data[1] / limit),
      total_count: data[1],
    };
  }
}
