import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";
import { User } from "../../users/entities";

@Entity('roles')
export class Role extends BaseEntity {
    // 1. primary key
    @PrimaryGeneratedColumn()
    id: number

    // 2. Tên của role: 'admin', 'user', 'moderator'...
    @Column({ unique: true, length: 50})
    name: string 

    // 3. Mô tả role
    @Column({ nullable: true, length: 200})
    description: string

    // 4. Trạng thái của role, giúp admin có thể 'soft deactivate' mà không cần xóa lịch sử của user đấy
    @Column({ nullable: false })
    isActive: boolean

    // 5. Hai cột createdAt và updatedAt extends qua base entity rồi
    // 6. Many to many với user. Biểu thức thứ nhất là callback chỉ định 'đối tác'
    // Callback thứ hai thể hiện quan hệ với biến nào trong entity bên kia
    @ManyToMany(() => User, (user) => user.roles)
    users: User[]
}