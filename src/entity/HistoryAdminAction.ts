import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Admin } from "./Admin";

@Entity()
export default class HistoryAdminAction extends BaseEntity {
  @PrimaryGeneratedColumn()
  hid: number;

  @Column()
  type_action: string;

  @Column()
  table_name: string;

  @Column()
  data: string;

  @CreateDateColumn()
  create_at: string;

  @ManyToOne(() => Admin)
  creator: Admin;
}
