import { ArgsType, Field } from "type-graphql";
import { FileUpload, GraphQLUpload } from "graphql-upload";

@ArgsType()
export class EditAdminArgs {
  @Field({ nullable: false })
  id: string;

  @Field({ nullable: false })
  username: string;

  @Field({ nullable: false })
  group_id: number;

  @Field(() => GraphQLUpload)
  avatar?: FileUpload;
}
