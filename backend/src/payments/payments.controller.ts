import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe payment intent for a booking' })
  async createIntent(@Body('bookingId') bookingId: string) {
    return this.paymentsService.createPaymentIntent(bookingId);
  }

  @Post('fulfill/:stripePaymentId')
  @ApiOperation({ summary: 'Fulfill a payment (webhook or mock success handler)' })
  async fulfill(@Param('stripePaymentId') stripePaymentId: string) {
    return this.paymentsService.fulfillPayment(stripePaymentId);
  }
}
