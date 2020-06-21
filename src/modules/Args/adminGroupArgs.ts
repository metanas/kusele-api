import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class AdminGroupArgs {
  @Field({ nullable: false })
  public name: string;

  @Field(() => [String], { nullable: false })
  public access: string[];

  @Field(() => [String], { nullable: false })
  public modify: string[];
}
