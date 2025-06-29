import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fcm_token: string;

  @ManyToOne(() => User, (u) => u.devices, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: 'unknown' })
  platform: 'ios' | 'android' | 'web' | 'unknown';

  @CreateDateColumn()
  createdAt: Date;
}
