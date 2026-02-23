import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletTransactionType } from '@prisma/client';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) { }

  async getWalletForUser(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });

    if (!wallet) {
      // Create wallet if doesn't exist
      wallet = await this.prisma.wallet.create({
        data: { userId },
        include: { transactions: true },
      });
    }

    return wallet;
  }

  async releaseEscrow(teacherId: string, amount: any, bookingId: string) {
    const wallet = await this.getWalletForUser(teacherId);
    const numAmount = Number(amount);

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: { decrement: numAmount },
        releasedBalance: { increment: numAmount },
        totalEarnings: { increment: numAmount },
        transactions: {
          create: {
            amount: numAmount,
            type: WalletTransactionType.RELEASE,
            status: 'COMPLETED',
            description: `Escrow released for booking ${bookingId}`,
            bookingId,
          },
        },
      },
    });
  }
}

