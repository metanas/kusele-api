import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class PermissionType {
  @Field(() => [String])
  public access: string[];

  @Field(() => [String])
  public modify: string[];
}
