import { ArgsType, Field } from "type-graphql";
import { MinLength } from "class-validator";

@ArgsType()
export class LoginArgs {
  @Field()
  username: string;

  @Field()
  @MinLength(8)
  password: string;
}
