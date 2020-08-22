import { Resolver, Query, Arg, Mutation, Args } from "type-graphql";
import { Product } from "../../entity/Product";
import { ElasticService } from "../../utils/ElasticService";
import { PaginatedRequestArgsBase } from "../../modules/Args/PaginatedRequestArgsBase";
import { Inject } from "typedi";
import { PaginatedProductResponse, PaginatedProductResponseType } from "../../@types/PaginatedResponseTypes";
import { ceil } from "lodash";

@Resolver()
export class ProductResolver {
  @Inject("elasticSearch")
  elasticService: ElasticService;

  @Query(() => PaginatedProductResponse)
  public async getProducts(
    @Args() { name, limit, page }: PaginatedRequestArgsBase,
  ): Promise<PaginatedProductResponseType> {
    let params = {};
    if (name) {
      params = {
        query: {
          match: {
            name,
          },
        },
      };
    }
    const { body } = await this.elasticService.client.search({
      index: "product",
      from: (page - 1) * limit,
      size: limit,
      body: params,
    });

    const data = body.hits.hits;
    const total_count = body.hits.total.value;

    return {
      data,
      total_count,
      last_page: ceil(total_count / limit),
    };
  }

  @Mutation(() => Product, { nullable: true })
  public async addProduct(@Arg("name") name: string): Promise<Product> {
    const product = await Product.create({
      name,
    }).save();

    await this.elasticService.client.index({
      index: "product",
      id: product.id,
      body: product,
      refresh: "true",
    });

    return product;
  }
}
