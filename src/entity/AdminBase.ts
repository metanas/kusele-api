import { BaseEntity, CreateDateColumn, ManyToOne, UpdateDateColumn } from "typeorm";
import { Admin } from "./Admin";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export abstract class AdminBase extends BaseEntity {
  @Field()
  @UpdateDateColumn({ type: "timestamp", nullable: true })
  updated_at: string;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  created_at: string;

  @ManyToOne(() => Admin, { nullable: true })
  created_by: Admin;

  @ManyToOne(() => Admin, { nullable: true })
  updated_by: Admin;
}
