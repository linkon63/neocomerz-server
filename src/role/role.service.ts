import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignPermissionsDto,
  CreatePermissionDto,
  CreateRoleDto,
  UpdateRoleDto,
} from './dto/role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  createRole(dto: CreateRoleDto) {
    return this.prisma.role.create({ data: dto });
  }

  roles() {
    return this.prisma.role.findMany({ include: { permissions: true, users: true } });
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.ensureRole(id);
    return this.prisma.role.update({ where: { id }, data: dto });
  }

  async removeRole(id: string) {
    await this.ensureRole(id);
    await this.prisma.role.delete({ where: { id } });
    return { message: 'Role deleted successfully' };
  }

  createPermission(dto: CreatePermissionDto) {
    return this.prisma.permission.create({ data: dto });
  }

  permissions() {
    return this.prisma.permission.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async assignPermissions(roleId: string, dto: AssignPermissionsDto) {
    await this.ensureRole(roleId);
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: dto.permissionIds?.map((id) => ({ id })) ?? [],
        },
      },
      include: { permissions: true },
    });
  }

  private async ensureRole(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);
    return role;
  }
}
