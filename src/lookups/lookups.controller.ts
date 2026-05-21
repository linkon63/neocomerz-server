import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Lookups')
@Controller()
export class LookupsController {
  @Get('suppliers')
  @ApiOperation({ summary: 'List product suppliers' })
  getSuppliers() {
    return [
      { id: '00000000-0000-4000-8000-000000000001', name: 'Default Supplier' },
    ];
  }

  @Get('branches')
  @ApiOperation({ summary: 'List store branches' })
  getBranches() {
    return [
      { id: '00000000-0000-4000-8000-000000000002', name: 'Main Branch' },
    ];
  }

  @Get('channels')
  @ApiOperation({ summary: 'List sales channels' })
  getChannels() {
    return [
      { id: '00000000-0000-4000-8000-000000000003', name: 'Online Store' },
      { id: '00000000-0000-4000-8000-000000000004', name: 'Admin POS' },
    ];
  }

  @Get('vat')
  @ApiOperation({ summary: 'List VAT rates' })
  getVatRates() {
    return [
      { id: '00000000-0000-4000-8000-000000000005', name: 'No VAT', rate: 0 },
      { id: '00000000-0000-4000-8000-000000000006', name: 'Standard VAT', rate: 15 },
    ];
  }
}
