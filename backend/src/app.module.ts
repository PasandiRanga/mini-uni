import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
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
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
        FRONTEND_URL: Joi.string().uri().optional(),
      }),
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
    AdminModule,
  ],
})
export class AppModule { }

