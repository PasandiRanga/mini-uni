import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleMeetModule } from '../google-meet/google-meet.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [PrismaModule, GoogleMeetModule, WalletsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule { }
