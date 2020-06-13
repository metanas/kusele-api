import { ArgsType, Field } from "type-graphql";
import { IsEmail, MinLength } from "class-validator";

@ArgsType()
export class AdminArgs {
  @Field({ nullable: true })
  @IsEmail()
  public email?: string;

  @Field({ nullable: true })
  @MinLength(8)
  public password: string;

  @Field({ nullable: true })
  public username?: string;

  @Field({ nullable: true })
  public group_id: number;
}
