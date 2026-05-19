import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';

@Injectable()
export class ChannelService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateChannelDto) {
    return this.prisma.channel.create({ data: dto });
  }

  findAll() {
    return this.prisma.channel.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (!channel) throw new NotFoundException(`Channel with ID ${id} not found`);
    return channel;
  }

  async update(id: string, dto: UpdateChannelDto) {
    await this.findOne(id);
    return this.prisma.channel.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.channel.delete({ where: { id } });
  }
}
