import { Arg, Query, Resolver, Args } from "type-graphql";
import { Product } from "../../entity/Product";
import { ElasticService } from "../../utils/ElasticService";
import { PaginatedProductResponse, PaginatedProductResponseType } from "../../@types/PaginatedResponseTypes";
import { PaginatedRequestArgs } from "../../modules/Args/PaginatedRequestArgs";
import { ceil } from "lodash";
import { Inject } from "typedi";

@Resolver()
export class ProductResolver {
  @Inject("elasticSearch")
  elasticService: ElasticService;

  @Query(() => Product, { nullable: true })
  public async getProduct(@Arg("id") id: string): Promise<Product | Error> {
    const product = Product.findOne({ where: { id } });

    return product ? product : Error("not found");
  }

  @Query(() => PaginatedProductResponse)
  public async getProducts(@Args() { page, limit, name }: PaginatedRequestArgs): Promise<PaginatedProductResponseType> {
    let params = {};

    if (name) {
      params = {
        query: {
          match: {
            name: name,
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

    const products: Product[] = body.hits.hits.map((hit: { _source: Record<string, unknown> }) => hit._source);
    const total = body.hits.total.value;

    return {
      data: products,
      last_page: ceil(total / limit),
      total_count: total,
    };
  }
}
