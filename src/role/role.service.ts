import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities';
import { User } from 'src/users/entities';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByName(roleName: string) : Promise<Role | null> {
    return await this.roleRepository.findOne({ where: { name: roleName } })
  }

  async findByNameOrThrow(roleName: string) : Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { name: roleName } })

    if (!role) {
      throw new NotFoundException(`Role with name ${roleName} not found`);
    }
    return role;
  }

  async assignRole(userId: number, roleName: string = 'user') {
    const role = await this.findByNameOrThrow(roleName)
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['roles'] })
    if (!user) 
      throw new NotFoundException('User not found');

    // Tránh gán trùng vai trò
    const alreadyHasRole = user.roles.some(r => r.id === role.id);
    if (alreadyHasRole) 
      return;
    user.roles.push(role);

    await this.userRepository.save(user)
  }
}