import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { Inject } from "typedi";
import { ElasticService } from "../../utils/ElasticService";
import { ElasticServiceTesting } from "../../../test/test-utils/ElasticService";
import { AwsS3 } from "../../utils/AwsS3";
import { S3Mock } from "../../../test/test-utils/S3Mock";
import { PaginatedStoreResponseType, PaginatedSupplierResponse } from "../../@types/PaginatedResponseTypes";
import { PaginatedRequestArgsBase } from "../../modules/Args/PaginatedRequestArgsBase";
import Supplier from "../../entity/Supplier";
import { ceil } from "lodash";
import { CreateSupplierArgs } from "../../modules/Args/supplier/createSupplierArgs";
import { ApiContext } from "../../@types/ApiContext";
import { StateEnum } from "../../@types/StateEnum";
import { HistoryAdminAction } from "../../entity/HistoryAdminAction";

@Resolver()
export class SupplierResolver {
  @Inject("elasticSearch")
  elasticService: ElasticService | ElasticServiceTesting;

  @Inject("S3")
  AWS_s3: AwsS3 | S3Mock;

  @Authorized("Supplier/getSuppliers")
  @Query(() => PaginatedSupplierResponse)
  async getSuppliers(
    @Args() { name, order, page, limit, sort }: PaginatedRequestArgsBase,
  ): Promise<PaginatedStoreResponseType> {
    let params = {};
    let sorted = "created_at:desc";

    if (order) {
      sorted = `${order}:${sort}`;
    }

    if (name) {
      params = {
        query: {
          match_phrase_prefix: {
            first_name: name,
          },
        },
      };
    }

    const {
      body: { hits },
    } = await this.elasticService.client.search({
      index: "supplier",
      from: (page - 1) * limit,
      size: limit,
      sort: sorted,
      body: params,
    });

    const data = hits.hits.map(({ _source }: { _source: Supplier }) => ({
      ..._source,
      updated_at: new Date(_source.updated_at),
      created_at: new Date(_source.created_at),
    }));
    const total_count = hits.total.value;

    return {
      data,
      total_count,
      last_page: ceil(total_count / limit),
    };
  }

  @Authorized("Supplier/createSupplier")
  @Mutation(() => Supplier)
  async createSupplier(
    @Ctx() { user }: ApiContext,
    @Args() { email, first_name, last_name }: CreateSupplierArgs,
  ): Promise<Supplier> {
    const supplier = await Supplier.create({
      email,
      first_name,
      last_name,
      created_by: user,
    }).save();

    await this.elasticService.client.index({
      index: "supplier",
      id: supplier.id,
      body: supplier,
      refresh: true,
    });

    return supplier;
  }

  @Authorized("Supplier/supplierToggleState")
  @Mutation(() => Supplier)
  async supplierToggleState(@Ctx() { user }: ApiContext, @Arg("id") id: string): Promise<Supplier> {
    const supplier = await Supplier.findOne({ where: { id } });

    if (!supplier) {
      throw new Error("Supplier not Found!");
    }

    supplier.state = supplier.state === StateEnum.Enabled ? StateEnum.Disabled : StateEnum.Enabled;
    supplier.updated_by = user;

    const data = await Supplier.createQueryBuilder()
      .update()
      .set({ state: supplier.state, updated_by: supplier.updated_by })
      .where("id=:id", { id })
      .returning(["updated_at"])
      .execute();

    await this.elasticService.client.update({
      index: "supplier",
      id,
      body: {
        doc: {
          state: supplier.state,
          updated_by: supplier.updated_by,
          updated_at: data.raw[0].updated_at,
        },
      },
    });

    return supplier;
  }

  @Authorized("Supplier/supplierToggleState")
  @Mutation(() => Boolean)
  async deleteSupplier(@Ctx() { user }: ApiContext, @Arg("id", { nullable: false }) id: string): Promise<boolean> {
    const supplier = await Supplier.findOne({ where: { id } });

    if (!supplier && supplier.state !== StateEnum.New) {
      throw new Error("You can delete this supplier");
    }

    await Supplier.createQueryBuilder().delete().where("id=:id", { id }).execute();

    await this.elasticService.client.delete({
      index: "supplier",
      id,
      refresh: true,
    });

    await HistoryAdminAction.create({
      creator: user,
      table_name: `"supplier"`,
      type_action: "DELETE",
      data: `DELETE FROM supplier WHERE id=${id}`,
    }).save();

    return true;
  }
}
