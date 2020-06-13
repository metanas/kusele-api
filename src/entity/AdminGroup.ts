import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { PermissionType } from "../modules/PermissionType";
import { Admin } from "./Admin";

@Entity()
@ObjectType()
export class AdminGroup extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  public id: number;

  @Field()
  @Column()
  public name: string;

  @Field(() => PermissionType)
  @Column({ type: "jsonb" })
  public permissions: PermissionType;

  @OneToMany(() => Admin, (admin: Admin) => admin.group)
  public admin: Admin[];
}
