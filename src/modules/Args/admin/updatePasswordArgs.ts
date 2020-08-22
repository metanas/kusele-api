import { ArgsType, Field } from "type-graphql";
import { MinLength } from "class-validator";

@ArgsType()
export class UpdatePasswordArgs {
  @Field({ nullable: false })
  @MinLength(8)
  public password: string;

  @Field({ nullable: false })
  @MinLength(8)
  public new_password: string;
}
