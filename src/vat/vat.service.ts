import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVatDto, UpdateVatDto } from './dto/vat.dto';

@Injectable()
export class VatService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateVatDto) {
    return this.prisma.vatRate.create({ data: dto });
  }

  findAll() {
    return this.prisma.vatRate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const vat = await this.prisma.vatRate.findUnique({ where: { id } });
    if (!vat) throw new NotFoundException(`VAT with ID ${id} not found`);
    return vat;
  }

  async update(id: string, dto: UpdateVatDto) {
    await this.findOne(id);
    return this.prisma.vatRate.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.vatRate.delete({ where: { id } });
  }
}
