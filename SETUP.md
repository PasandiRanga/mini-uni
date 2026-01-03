# MiniUni Setup Guide

This guide will help you set up the MiniUni application for development and production.

## Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for database and Redis)
- PostgreSQL 15+ (if not using Docker)
- Redis (if not using Docker)

## Project Structure

```
MiniUni/
├── backend/          # NestJS backend API
│   ├── src/
│   ├── prisma/
│   └── package.json
├── prisma/           # Root Prisma schema (reference)
├── src/              # Frontend (Vite + React)
└── docker-compose.yml
```

## Database Setup

### Option 1: Using Docker Compose (Recommended)

1. Start PostgreSQL and Redis:
```bash
docker-compose up -d postgres redis
```

2. The database will be available at:
   - Host: `localhost`
   - Port: `5432`
   - Database: `miniuni`
   - User: `miniuni`
   - Password: `miniuni_password`

### Option 2: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
```sql
CREATE DATABASE miniuni;
```

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
DATABASE_URL="postgresql://miniuni:miniuni_password@localhost:5432/miniuni?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
# ... other environment variables
```

5. Generate Prisma Client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:migrate
```

This will create all the database tables based on the Prisma schema.

7. (Optional) Open Prisma Studio to view your database:
```bash
npm run prisma:studio
```

8. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`
API documentation (Swagger) will be available at `http://localhost:3000/api/docs`

## Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:3000/api
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:8080`

## Database Schema

The database includes the following main models:

- **User**: Base user model with role-based access (STUDENT, TEACHER, ADMIN)
- **TeacherProfile**: Teacher-specific information and verification status
- **StudentProfile**: Student-specific information
- **VerificationDocument**: Teacher verification documents
- **Post**: Student requests and teacher offerings
- **Inquiry**: Communication between students and teachers
- **TimeSlot**: Available time slots for classes
- **Booking**: Confirmed class bookings
- **Payment**: Stripe payment records
- **Wallet**: Teacher virtual wallet for escrow
- **WalletTransaction**: Wallet transaction history
- **Notification**: User notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user profile (requires authentication)

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/:id` - Get a specific post
- `PUT /api/posts/:id` - Update a post
- `DELETE /api/posts/:id` - Delete a post

### Inquiries
- `POST /api/inquiries` - Create an inquiry
- `GET /api/inquiries` - Get user's inquiries
- `PUT /api/inquiries/:id` - Update inquiry status

### Bookings
- `POST /api/bookings` - Create a booking
- `GET /api/bookings` - Get user's bookings
- `PUT /api/bookings/:id/confirm` - Confirm class completion

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/webhook` - Stripe webhook endpoint

### Wallets
- `GET /api/wallets/me` - Get user's wallet
- `GET /api/wallets/transactions` - Get wallet transactions

### Notifications
- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/miniuni?schema=public"

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google Meet API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

## Docker Production Deployment

1. Build and start all services:
```bash
docker-compose up -d
```

2. Run database migrations:
```bash
docker-compose exec backend npm run prisma:migrate:deploy
```

3. View logs:
```bash
docker-compose logs -f backend
```

## Development Workflow

1. Make changes to the Prisma schema in `backend/prisma/schema.prisma`
2. Create a migration: `npm run prisma:migrate`
3. Generate Prisma Client: `npm run prisma:generate`
4. Update your NestJS services and controllers
5. Test the API endpoints using Swagger UI

## Next Steps

- Implement full CRUD operations for all modules
- Add Stripe payment integration
- Integrate Google Meet API for automatic link generation
- Add Redis caching for frequently accessed data
- Implement email notifications
- Add location-based search functionality
- Create admin dashboard for verification review

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database credentials

### Prisma Issues
- Run `npm run prisma:generate` after schema changes
- Run `npm run prisma:migrate` to apply migrations
- Use `npm run prisma:studio` to inspect the database

### Port Conflicts
- Change ports in docker-compose.yml if needed
- Update FRONTEND_URL and PORT in .env files accordingly

