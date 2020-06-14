import { Arg, Args, Mutation, Query, Resolver } from "type-graphql";
import { Admin } from "../../entity/Admin";
import { PaginatedAdminResponse, PaginatedAdminResponseType } from "../../@types/PaginatedResponseTypes";
import { PaginatedRequestArgs } from "../../modules/Args/PaginatedRequestArgs";
import { ElasticService } from "../../utils/ElasticService";
import { ceil } from "lodash";
import { Inject } from "typedi";
import { AdminArgs } from "../../modules/Args/AdminArgs";
import { ElasticServiceTesting } from "../../../test/test-utils/ElasticService";

@Resolver()
export class AdminResolver {
  @Inject("elasticSearch")
  elasticService: ElasticService | ElasticServiceTesting;

  @Query(() => Admin)
  public async getAdmin(@Arg("id") id: string): Promise<Admin> {
    const admin = await Admin.findOne({ where: { id } });

    if (!admin) {
      throw new Error("Admin not found!");
    }

    return admin;
  }

  @Query(() => PaginatedAdminResponse)
  public async getAdmins(
    @Arg("email") email: string,
    @Args() { name, limit, page }: PaginatedRequestArgs,
  ): Promise<PaginatedAdminResponseType> {
    let params = {};

    if (name || email) {
      params = {
        query: {
          match_phrase: {
            username: name,
            email,
          },
        },
      };
    }

    const { body } = await this.elasticService.client.search({
      index: "admin",
      from: (page - 1) * limit,
      size: limit,
      sort: "create_at:desc",
      body: params,
    });

    const data = body.hits.hits.map((hit: { _source: Record<string, unknown> }) => hit._source);
    const total_count = body.hits.total.value;

    return {
      data,
      total_count,
      last_page: ceil(total_count / limit),
    };
  }

  @Mutation(() => Admin, { nullable: true })
  private async addAdmin(@Args() { email }: AdminArgs): Promise<Admin> {
    const admin = await Admin.create({
      email,
    }).save();

    await this.elasticService.client.index({
      index: "admin",
      id: admin.id,
      body: admin,
    });

    return admin;
  }
}
