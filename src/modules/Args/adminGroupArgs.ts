import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class AdminGroupArgs {
  @Field({ nullable: false })
  public name: string;

  @Field(() => [String], { nullable: false })
  public permissions: string[];
}
