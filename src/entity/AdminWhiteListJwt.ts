import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Admin } from "./Admin";

@Entity()
export class AdminWhiteListJwt extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: string;

  @CreateDateColumn({ type: "timestamp", default: () => "(CURRENT_TIMESTAMP + '30 days'::interval)" })
  public expire_at: Date;

  @Column({ default: 0 })
  public version: number;

  @ManyToOne(() => Admin)
  public admin: Admin;
}
