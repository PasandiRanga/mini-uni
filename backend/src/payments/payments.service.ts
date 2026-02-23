import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeSecret = this.configService.get<string>('STRIPE_SECRET_KEY') || 'mock_key';
    this.stripe = new Stripe(stripeSecret, {
      apiVersion: '2023-10-16' as any,
    });
  }

  async createPaymentIntent(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { teacher: true, student: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Create payment intent
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(Number(booking.fee) * 100), // amount in cents
      currency: 'usd',
      metadata: { bookingId },
    });

    // Create payment record in DB
    await this.prisma.payment.create({
      data: {
        bookingId,
        amount: booking.fee,
        stripePaymentId: intent.id,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      clientSecret: intent.client_secret,
      publishableKey: this.configService.get<string>('STRIPE_PUBLISHABLE_KEY'),
    };
  }

  async fulfillPayment(stripePaymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentId },
      include: { booking: true },
    });

    if (!payment) throw new NotFoundException('Payment record not found');

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.COMPLETED },
    });

    // Update booking status
    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });

    // Handle wallet logic: increment teacher's pending balance
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: payment.booking.teacherId },
    });

    if (wallet) {
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: { increment: payment.amount },
          transactions: {
            create: {
              amount: payment.amount,
              type: 'DEPOSIT',
              status: 'COMPLETED',
              description: `Pending payment for booking ${payment.bookingId}`,
              bookingId: payment.bookingId,
            },
          },
        },
      });
    }

    return { success: true };
  }
}

