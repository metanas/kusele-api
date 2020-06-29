import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
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
  @Column({ unique: true })
  public email: string;

  @Column({ nullable: true })
  public password: string;

  @Field()
  @CreateDateColumn()
  public create_at: string;

  @Field()
  @UpdateDateColumn({ nullable: true })
  public update_at: string;

  @Field(() => StateEnum)
  @Column("text", { default: StateEnum.New })
  public state: StateEnum;

  @Column({ nullable: true })
  public reset_password_token: string;

  @Column({ type: "timestamp", nullable: true })
  public reset_password_send_at: Date;

  @ManyToOne(() => AdminGroup, (group: AdminGroup) => group.admin, { nullable: true })
  @Field(() => AdminGroup)
  @JoinColumn()
  public group: AdminGroup;
}
