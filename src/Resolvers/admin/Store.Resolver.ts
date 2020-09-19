import { Resolver, Query, Arg, Args, Mutation } from "type-graphql";
import { Inject } from "typedi";
import { ElasticService } from "../../utils/ElasticService";
import { ElasticServiceTesting } from "../../../test/test-utils/ElasticService";
import { AwsS3 } from "../../utils/AwsS3";
import { S3Mock } from "../../../test/test-utils/S3Mock";
import Store from "../../entity/Store";
import { PaginatedStoreResponse, PaginatedStoreResponseType } from "../../@types/PaginatedResponseTypes";
import { PaginatedRequestArgsBase } from "../../modules/Args/PaginatedRequestArgsBase";
import { ceil, set } from "lodash";
import { CreateStoreArgs } from "../../modules/Args/store/createStoreArgs";
import Supplier from "../../entity/Supplier";
import { ManagedUpload } from "aws-sdk/clients/s3";
import { v1 } from "uuid";

@Resolver()
export class StoreResolver {
  @Inject("elasticSearch")
  elasticService: ElasticService | ElasticServiceTesting;

  @Inject("S3")
  AWS_s3: AwsS3 | S3Mock;

  @Query(() => Store)
  async getStore(@Arg("id", { nullable: false }) id: string): Promise<Store> {
    const { body } = await this.elasticService.client.getSource({
      index: "store",
      id,
    });

    return body as Store;
  }

  @Query(() => PaginatedStoreResponse)
  async getStores(
    @Args() { name, limit, page, order, sort }: PaginatedRequestArgsBase,
  ): Promise<PaginatedStoreResponseType> {
    let params = {};

    let sorted = "created_at:desc";

    if (name) {
      params = {
        query: {
          match_phrase_prefix: {
            name,
          },
        },
      };
    }

    if (order) {
      sorted = `${order}:${sort}`;
    }

    const {
      body: { hits },
    } = await this.elasticService.client.search({
      index: "store",
      from: (page - 1) * limit,
      size: limit,
      sort: sorted,
      body: params,
    });

    const data = hits.hits.map(({ _source }: { _source: Store }) => ({
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

  @Mutation(() => Store)
  async createStore(@Args() { name, cover, logo, owner }: CreateStoreArgs): Promise<Store> {
    const params = {
      name,
    };

    let image: ManagedUpload.SendData = null;

    if (logo?.filename) {
      image = await this.AWS_s3.S3.upload({
        Key: `kusele-${v1()}`,
        Body: logo.createReadStream(),
        Bucket: "kusele-storage",
      }).promise();

      set(params, "logo", image.Location);
    }

    if (cover?.filename) {
      image = await this.AWS_s3.S3.upload({
        Key: `kusele-${v1()}`,
        Body: cover.createReadStream(),
        Bucket: "kusele-storage",
      }).promise();

      set(params, "cover", image.Location);
    }

    if (owner) {
      const supplier = await Supplier.findOne({
        where: {
          id: owner,
        },
      });

      if (!supplier) throw new Error("Supplier not found!");

      set(params, "owner", supplier);
    }

    const store = await Store.create(params).save();

    await this.elasticService.client.index({
      index: "store",
      body: store,
      refresh: true,
    });

    return store;
  }
}
