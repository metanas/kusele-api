import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Admin } from "./Admin";
import { Field, GraphQLISODateTime, ObjectType } from "type-graphql";

@Entity()
@ObjectType()
export class HistoryAdminAction extends BaseEntity {
  @PrimaryGeneratedColumn()
  hid: number;

  @Field()
  @Column()
  type_action: string;

  @Field()
  @Column()
  table_name: string;

  @Column()
  @Field()
  data: string;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn({ type: "timestamp" })
  created_at: string;

  @Field(() => Admin)
  @ManyToOne(() => Admin, { eager: true })
  creator: Admin;
}
