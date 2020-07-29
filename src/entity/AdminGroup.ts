import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { Admin } from "./Admin";
import { AdminBase } from "./AdminBase";

@Entity()
@ObjectType()
export class AdminGroup extends AdminBase {
  @Field()
  @PrimaryGeneratedColumn()
  public id: number;

  @Field()
  @Column()
  public name: string;

  @Field(() => [String])
  @Column({ type: "jsonb" })
  public permissions: string[];

  @OneToMany(() => Admin, (admin: Admin) => admin.group)
  public admin: Admin[];
}
