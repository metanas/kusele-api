/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types */
import { SchemaDirectiveVisitor } from "apollo-server-express";
import { GraphQLField, GraphQLInterfaceType, GraphQLObjectType } from "graphql";

export default class InternationalizationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(
    field: GraphQLField<any, any>,
    details: {
      objectType: GraphQLObjectType | GraphQLInterfaceType;
    },
  ): any {
    const { resolve } = field;
    field.resolve = async (...args) => {
      const context = args[2];
      const defaultText = await resolve.apply(this, args);
      // In this example, path would be ["Query", "greeting"]:
      const path = [details.objectType.name, field.name];
      return `${defaultText}, ${path}, ${context.locale}`;
    };
  }
}
