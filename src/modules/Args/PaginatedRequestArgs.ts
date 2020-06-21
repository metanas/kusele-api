import { ArgsType, Field } from "type-graphql";
import { IsInt, IsString, Max, Min } from "class-validator";
import { OrderEnum } from "../../@types/OrderEnum";

@ArgsType()
export class PaginatedRequestArgs {
  @Field({ defaultValue: 1 })
  @IsInt()
  public page: number;

  @Field({ defaultValue: 20 })
  @IsInt()
  @Max(100)
  @Min(1)
  public limit: number;

  @Field({ nullable: true })
  @IsString()
  public name?: string;

  @Field({ nullable: true })
  public order: string;

  @Field({ defaultValue: OrderEnum.ASC })
  public sort: string;
}
