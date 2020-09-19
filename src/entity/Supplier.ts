import { AdminBase } from "./AdminBase";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType, ID } from "type-graphql";
import Store from "./Store";
import { StateEnum } from "../@types/StateEnum";

@Entity()
@ObjectType()
export default class Supplier extends AdminBase {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column({ nullable: true })
  first_name: string;

  @Field()
  @Column({ nullable: true })
  last_name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field(() => StateEnum)
  @Column({ type: "text", default: StateEnum.New })
  state: StateEnum;

  @Column({ nullable: true })
  password?: string;

  @OneToMany(() => Store, (store: Store) => store.id)
  store: Store;
}
