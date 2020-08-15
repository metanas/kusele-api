import { ArgsType, Field } from "type-graphql";
import { MinLength } from "class-validator";

@ArgsType()
export class PasswordArgs {
  @Field({ nullable: true })
  @MinLength(8)
  public password: string;

  @Field({ nullable: true })
  @MinLength(8)
  public new_password: string;
}
