import { ArgsType, Field } from "type-graphql";
import { IsEmail } from "class-validator";

@ArgsType()
export class CreateSupplierArgs {
  @Field({ nullable: true })
  first_name: string;

  @Field()
  last_name?: string;

  @Field({ nullable: false })
  @IsEmail()
  email: string;
}
