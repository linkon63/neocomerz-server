import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ConfirmPaymentDto,
  CreateManualPaymentDto,
  InitiatePaymentDto,
} from './dto/payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate payment for an order (admin only)' })
  initiate(@Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiate(dto);
  }

  @Post('manual')
  @ApiOperation({ summary: 'Create manual payment record (admin only)' })
  createManual(@Body() dto: CreateManualPaymentDto) {
    return this.paymentService.createManual(dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm payment status (admin only)' })
  confirm(@Body() dto: ConfirmPaymentDto) {
    return this.paymentService.confirm(dto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Payment provider webhook placeholder (admin only)' })
  webhook(@Body() payload: any) {
    return this.paymentService.webhook(payload);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payments by order ID (admin only)' })
  orderPayments(@Param('orderId') orderId: string) {
    return this.paymentService.orderPayments(orderId);
  }
}
