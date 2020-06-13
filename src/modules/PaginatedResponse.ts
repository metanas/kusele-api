import { ClassType, Field, ObjectType } from "type-graphql";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function PaginationResponse<T>(Items: ClassType<T>) {
  @ObjectType(`Paginated${Items.name}Response`)
  abstract class PaginationResponseClass {
    @Field(() => [Items])
    public data: T[];

    @Field({ name: "last_page" })
    public last_page: number;

    @Field({ name: "total_count" })
    public total_count: number;
  }
  return PaginationResponseClass;
}
