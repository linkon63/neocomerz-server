import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VatController } from './vat.controller';
import { VatService } from './vat.service';

@Module({
  imports: [PrismaModule],
  controllers: [VatController],
  providers: [VatService],
})
export class VatModule {}
