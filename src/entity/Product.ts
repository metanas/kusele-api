import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, JoinTable } from "typeorm";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import { StateEnum } from "../@types/StateEnum";
import { ProductImages } from "./ProductImages";

registerEnumType(StateEnum, { name: "state" });

@Entity()
@ObjectType()
export class Product extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Field()
  @Column({ type: "citext" })
  public name: string;

  @Field()
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  public create_at: string;

  @Field(() => StateEnum)
  @Column("text", { default: StateEnum.New })
  public state: StateEnum;

  @OneToMany(() => ProductImages, (productImage: ProductImages) => productImage.product, {
    onDelete: "CASCADE",
    eager: true,
  })
  @Field(() => [ProductImages])
  @JoinTable()
  public images: ProductImages[];
}
