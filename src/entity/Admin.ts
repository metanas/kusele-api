import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";
import { StateEnum } from "../@types/StateEnum";
import { AdminGroup } from "./AdminGroup";

@ObjectType()
@Entity()
export class Admin extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Field()
  @Column({ nullable: true })
  public username: string;

  @Field()
  @Column()
  public email: string;

  @Column({ nullable: true })
  public password: string;

  @Field()
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  public create_at: string;

  @Field(() => StateEnum)
  @Column("text", { default: StateEnum.New })
  public state: StateEnum;

  @ManyToOne(() => AdminGroup, (group: AdminGroup) => group.admin, { eager: true, nullable: true })
  @Field(() => AdminGroup)
  public group: AdminGroup;
}
