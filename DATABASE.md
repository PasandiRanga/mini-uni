# Database Setup Guide

This document provides detailed information about the MiniUni database schema and setup.

## Database Schema Overview

The MiniUni application uses PostgreSQL with Prisma ORM. The schema is defined in `backend/prisma/schema.prisma`.

## Models

### Core User Models

#### User
Base user model with role-based access control.
- **Fields**: id, email, password, firstName, lastName, role, isActive, emailVerified
- **Roles**: STUDENT, TEACHER, ADMIN
- **Relations**: TeacherProfile, StudentProfile, Posts, Inquiries, Bookings, Wallet, Notifications

#### TeacherProfile
Teacher-specific information and verification status.
- **Fields**: id, userId, bio, experience, subjects[], hourlyRate, verificationStatus
- **Relations**: User, VerificationDocument[]

#### StudentProfile
Student-specific information.
- **Fields**: id, userId, grade, interests[]
- **Relations**: User

#### VerificationDocument
Teacher verification documents (ID, qualifications, certificates).
- **Fields**: id, teacherId, documentType, documentUrl, status, reviewedBy, reviewedAt, rejectionReason
- **Status**: PENDING, APPROVED, REJECTED

### Content Models

#### Post
Student requests and teacher offerings.
- **Fields**: id, userId, type, title, description, subject, grade, syllabus, fee, experience, locationLat, locationLng, isActive
- **Type**: STUDENT_REQUEST, TEACHER_OFFERING
- **Relations**: User, Inquiry[], TimeSlot[], PostLike[], Comment[]

#### PostLike
Post likes/reactions.
- **Fields**: id, postId, userId
- **Unique**: (postId, userId)

#### Comment
Post comments.
- **Fields**: id, postId, userId, content

### Communication Models

#### Inquiry
Private messages between students and teachers.
- **Fields**: id, postId, senderId, receiverId, message, status
- **Status**: PENDING, RESPONDED, ACCEPTED, REJECTED, CANCELLED
- **Relations**: Post, User (sender/receiver), TimeSlot[], Booking

#### TimeSlot
Available time slots for classes.
- **Fields**: id, postId, inquiryId, startTime, endTime, status
- **Status**: AVAILABLE, SELECTED, CONFIRMED, BOOKED, CANCELLED
- **Relations**: Post?, Inquiry?, Booking

### Booking & Payment Models

#### Booking
Confirmed class bookings.
- **Fields**: id, inquiryId, studentId, teacherId, timeSlotId, status, fee, googleMeetLink, studentConfirmed, teacherConfirmed, completedAt, cancelledAt, cancellationReason
- **Status**: PENDING_PAYMENT, PAYMENT_COMPLETED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, DISPUTED
- **Relations**: Inquiry, User (student/teacher), TimeSlot, Payment, WalletTransaction

#### Payment
Stripe payment records.
- **Fields**: id, bookingId, stripePaymentId, amount, status, currency, metadata
- **Status**: PENDING, COMPLETED, FAILED, REFUNDED
- **Relations**: Booking

### Wallet Models

#### Wallet
Teacher virtual wallet for escrow.
- **Fields**: id, userId, pendingBalance, releasedBalance, totalEarnings
- **Relations**: User, WalletTransaction[]

#### WalletTransaction
Wallet transaction history.
- **Fields**: id, walletId, bookingId, type, amount, description, status
- **Type**: DEPOSIT, WITHDRAWAL, RELEASE, REFUND
- **Status**: PENDING, COMPLETED, FAILED
- **Relations**: Wallet, Booking?

### Notification Model

#### Notification
User notifications.
- **Fields**: id, userId, type, title, message, isRead, metadata
- **Type**: INQUIRY_RECEIVED, SLOT_CONFIRMED, PAYMENT_SUCCESS, MEETING_LINK_CREATED, CLASS_COMPLETION, VERIFICATION_STATUS, BOOKING_CONFIRMED, BOOKING_CANCELLED
- **Relations**: User

## Database Indexes

The schema includes optimized indexes for:

- **User**: email, role
- **Post**: userId, type, subject, isActive, location (lat/lng composite)
- **Inquiry**: postId, senderId, receiverId, status
- **TimeSlot**: postId, inquiryId, startTime/endTime, status
- **Booking**: studentId, teacherId, status, timeSlotId
- **Payment**: bookingId, stripePaymentId, status
- **Wallet**: userId
- **WalletTransaction**: walletId, bookingId, type, status
- **Notification**: userId, isRead, createdAt

## Setup Instructions

### 1. Start PostgreSQL

Using Docker:
```bash
docker-compose up -d postgres
```

Or use local PostgreSQL instance.

### 2. Configure Database URL

Update `backend/.env`:
```env
DATABASE_URL="postgresql://miniuni:miniuni_password@localhost:5432/miniuni?schema=public"
```

### 3. Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

### 4. Run Migrations

Create and apply migrations:
```bash
cd backend
npm run prisma:migrate
```

This will:
- Create a new migration file
- Apply the migration to the database
- Generate Prisma Client

### 5. Seed Database (Optional)

Seed with sample data:
```bash
cd backend
npm run prisma:seed
```

This creates:
- Admin user (admin@miniuni.com / admin123)
- Sample teacher (teacher@miniuni.com / teacher123)
- Sample student (student@miniuni.com / student123)

### 6. View Database

Open Prisma Studio:
```bash
cd backend
npm run prisma:studio
```

Access at http://localhost:5555

## Migration Workflow

### Creating a New Migration

1. Modify `backend/prisma/schema.prisma`
2. Create migration:
```bash
cd backend
npm run prisma:migrate
```
3. Enter migration name when prompted
4. Review generated migration files in `backend/prisma/migrations/`

### Applying Migrations in Production

```bash
cd backend
npm run prisma:migrate:deploy
```

This applies pending migrations without prompting.

### Resetting Database (Development Only)

⚠️ **Warning**: This will delete all data!

```bash
cd backend
npx prisma migrate reset
```

## Location-Based Queries

The schema includes a composite index on `locationLat` and `locationLng` for efficient location-based queries. Use PostgreSQL's PostGIS extension for advanced geospatial queries:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Example query to find posts within radius
SELECT * FROM posts
WHERE ST_DWithin(
  ST_MakePoint(location_lng, location_lat)::geography,
  ST_MakePoint($1, $2)::geography,
  $3 * 1000  -- radius in meters
);
```

## Escrow Flow

The wallet system implements an escrow pattern:

1. **Payment**: Student pays → Funds held in `pendingBalance`
2. **Class Completion**: Both student and teacher confirm
3. **Release**: Funds moved from `pendingBalance` to `releasedBalance`
4. **Withdrawal**: Teacher can withdraw `releasedBalance` to bank account

Transaction flow:
- `DEPOSIT`: Payment received → WalletTransaction created
- `RELEASE`: Class completed → Funds released
- `WITHDRAWAL`: Teacher withdraws → Funds sent to bank

## Best Practices

1. **Always use Prisma Client** - Never write raw SQL queries
2. **Use transactions** for multi-step operations (e.g., booking creation)
3. **Index frequently queried fields** - Already included in schema
4. **Use enums** for status fields - Type-safe and efficient
5. **Cascade deletes** - Configured for related data cleanup
6. **Soft deletes** - Use `isActive` flag instead of hard deletes where appropriate

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### Migration Issues
- Check migration files in `prisma/migrations/`
- Use `prisma migrate resolve` to mark migrations as applied
- Reset database in development: `prisma migrate reset`

### Prisma Client Issues
- Regenerate client: `npm run prisma:generate`
- Clear node_modules and reinstall
- Check Prisma version compatibility

