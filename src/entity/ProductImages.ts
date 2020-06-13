import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { Product } from "./Product";

@Entity()
@ObjectType()
export class ProductImages extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  public id: number;

  @Field()
  @Column({ type: "citext", nullable: true })
  public description: string;

  @Field()
  @Column({ nullable: false })
  public url: string;

  @Field()
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  public create_at: string;

  @Field()
  @Column()
  public position: number;

  @ManyToOne(() => Product, (product: Product) => product.images)
  public product: Product;
}
