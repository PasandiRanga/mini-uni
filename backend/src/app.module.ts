import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { WalletsModule } from './wallets/wallets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TeachersModule } from './teachers/teachers.module';
import { GoogleMeetModule } from './google-meet/google-meet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    InquiriesModule,
    BookingsModule,
    PaymentsModule,
    WalletsModule,
    NotificationsModule,
    TeachersModule,
    GoogleMeetModule,
  ],
})
export class AppModule {}

