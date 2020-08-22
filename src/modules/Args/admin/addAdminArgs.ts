import { ArgsType, Field } from "type-graphql";
import { IsEmail } from "class-validator";

@ArgsType()
export class AddAdminArgs {
  @Field({ nullable: true })
  @IsEmail()
  public email?: string;

  @Field({ nullable: false })
  public group_id: number;
}
