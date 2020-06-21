import { ObjectType, Field } from "type-graphql";
import { Admin } from "../entity/Admin";

@ObjectType()
export class LoginResponse {
  @Field(() => String)
  public token: string;

  @Field(() => Admin)
  public admin: Admin;
}
