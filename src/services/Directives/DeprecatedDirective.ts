/* eslint-disable @typescript-eslint/no-explicit-any */
import { SchemaDirectiveVisitor } from "apollo-server-express";
import { GraphQLEnumValue, GraphQLField } from "graphql";

export default class DeprecatedDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<any, any>): void {
    field.isDeprecated = true;
    field.deprecationReason = this.args.reason;
  }

  visitEnumValue(value: GraphQLEnumValue): void {
    value.isDeprecated = true;
    value.deprecationReason = this.args.reason;
  }
}
