import { ArgsType, Field } from "type-graphql";
import { IsEmail } from "class-validator";
import { PaginatedRequestArgsBase } from "../PaginatedRequestArgsBase";

@ArgsType()
export class GetAdminsArgs extends PaginatedRequestArgsBase {
  @IsEmail()
  @Field()
  email: string;
}
