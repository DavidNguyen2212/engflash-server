import { CreateDateColumn } from "typeorm";

export abstract class BaseEntity {
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @CreateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}