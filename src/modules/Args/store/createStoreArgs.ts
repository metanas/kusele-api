import { ArgsType, Field } from "type-graphql";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import { IsUUID } from "class-validator";

@ArgsType()
export class CreateStoreArgs {
  @Field({ nullable: false })
  name: string;

  @Field(() => GraphQLUpload)
  logo?: FileUpload;

  @Field(() => GraphQLUpload)
  cover?: FileUpload;

  @Field()
  @IsUUID()
  owner?: string;
}
