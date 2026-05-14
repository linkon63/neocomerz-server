import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSettingDto: CreateSettingDto) {
    return this.prisma.setting.create({
      data: createSettingDto,
    });
  }

  async findOne(id: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with ID ${id} not found`);
    }

    return setting;
  }

  async findFirst() {
    const setting = await this.prisma.setting.findFirst();
    return setting;
  }

  async update(id: string, updateSettingDto: UpdateSettingDto) {
    await this.findOne(id);

    return this.prisma.setting.update({
      where: { id },
      data: updateSettingDto,
    });
  }

  async updateFirst(updateSettingDto: UpdateSettingDto) {
    const setting = await this.findFirst();
    
    if (!setting) {
      return this.create(updateSettingDto as CreateSettingDto);
    }

    return this.prisma.setting.update({
      where: { id: setting.id },
      data: updateSettingDto,
    });
  }
}
