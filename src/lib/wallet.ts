import prisma from "./prisma";

export async function getWalletForUser(userId: string) {
    let wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });

    if (!wallet) {
        wallet = await prisma.wallet.create({
            data: { userId },
            include: { transactions: true },
        });
    }

    return wallet;
}

export async function releaseEscrow(teacherId: string, amount: any, bookingId: string) {
    const wallet = await getWalletForUser(teacherId);
    const numAmount = Number(amount);

    return prisma.wallet.update({
        where: { id: wallet.id },
        data: {
            pendingBalance: { decrement: numAmount },
            releasedBalance: { increment: numAmount },
            totalEarnings: { increment: numAmount },
            transactions: {
                create: {
                    amount: numAmount,
                    type: "RELEASE",
                    status: "COMPLETED",
                    description: `Escrow released for booking ${bookingId}`,
                    bookingId,
                },
            },
        },
    });
}
