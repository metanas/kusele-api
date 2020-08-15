import { Arg, Query, Resolver, Args, Authorized, UseMiddleware } from "type-graphql";
import { HistoryAdminAction } from "../../entity/HistoryAdminAction";
import { PaginatedRequestArgs } from "../../modules/Args/PaginatedRequestArgs";
import { PaginatedHistoryResponse, PaginatedHistoryResponseType } from "../../@types/PaginatedResponseTypes";
import { FindManyOptions } from "typeorm/find-options/FindManyOptions";
import { set, ceil } from "lodash";
import { isAdmin } from "../../../middleware/isAdmin";
import { Like } from "typeorm";

@Resolver()
export class HistoryAdminResolver {
  @UseMiddleware(isAdmin)
  @Authorized("HistoryAdmin/getHistory")
  @Query(() => PaginatedHistoryResponse)
  public async getHistory(
    @Arg("table", { nullable: true }) table: string,
    @Arg("type", { nullable: true }) type_action: string,
    @Args() { page, limit }: PaginatedRequestArgs,
  ): Promise<PaginatedHistoryResponseType> {
    const params: FindManyOptions = {
      skip: limit * (page - 1),
      take: limit,
      order: {
        created_at: "DESC",
      },
    };

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
