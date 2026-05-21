import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AssignPermissionsDto,
  CreatePermissionDto,
  CreateRoleDto,
  UpdateRoleDto,
} from './dto/role.dto';
import { RoleService } from './role.service';

@ApiTags('Roles & Permissions')
@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('roles')
  @ApiOperation({ summary: 'Create role' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.roleService.createRole(dto);
  }

  @Get('roles')
  @ApiOperation({ summary: 'List roles' })
  roles() {
    return this.roleService.roles();
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Update role' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete role' })
  removeRole(@Param('id') id: string) {
    return this.roleService.removeRole(id);
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Create permission' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.roleService.createPermission(dto);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List permissions' })
  permissions() {
    return this.roleService.permissions();
  }

  @Patch('roles/:id/permissions')
  @ApiOperation({ summary: 'Assign permissions to role' })
  assignPermissions(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
    return this.roleService.assignPermissions(id, dto);
  }
}
