import { Field, ObjectType } from "type-graphql";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StateEnum } from "../@types/StateEnum";
import { AdminBase } from "./AdminBase";
import Supplier from "./Supplier";

@Entity()
@ObjectType()
export default class Store extends AdminBase {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column({ type: "citext", unique: true })
  name: string;

  @Field(() => StateEnum)
  @Column("text", { default: StateEnum.New })
  state: StateEnum;

  @Field()
  @Column()
  logo: string;

  @Field()
  @Column()
  cover: string;

  @Field(() => Supplier)
  @ManyToOne(() => Supplier)
  owner: Supplier;
}
