import { ArgsType, Field } from "type-graphql";
import { MinLength } from "class-validator";
import { FileUpload, GraphQLUpload } from "graphql-upload";

@ArgsType()
export class CreateAdminArgs {
  @Field({ nullable: false })
  id: string;

  @Field({ nullable: false })
  username: string;

  @Field({ nullable: false })
  @MinLength(8)
  password: string;

  @Field(() => GraphQLUpload)
  avatar?: FileUpload;
}
