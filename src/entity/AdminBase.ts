import { BaseEntity, CreateDateColumn, ManyToOne, UpdateDateColumn } from "typeorm";
import { Admin } from "./Admin";
import { Field, GraphQLISODateTime, ObjectType } from "type-graphql";

@ObjectType()
export abstract class AdminBase extends BaseEntity {
  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn({ type: "timestamp", nullable: true })
  updated_at: Date;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn({ type: "timestamp", nullable: true })
  created_at: Date;

  @ManyToOne(() => Admin, { nullable: true })
  created_by: Admin;

  @ManyToOne(() => Admin, { nullable: true })
  updated_by: Admin;
}
