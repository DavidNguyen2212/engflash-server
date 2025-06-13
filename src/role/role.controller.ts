import { Controller } from '@nestjs/common';
import { RolesService } from './role.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  //   @Get()
  //   findAll() {
  //     return this.rolesService.findAll();
  //   }
}
