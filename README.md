# MiniUni - Class Marketplace Platform

A complete, production-ready, role-based web application that connects teachers and students in a social-media-style class marketplace. Students can post class requests, teachers can post available classes, communicate via inquiries, schedule classes, process payments securely through escrow, and meet online using auto-generated Google Meet links.

## Technology Stack

### Frontend
- **React** + **TypeScript** (Vite)
- **Tailwind CSS** for styling
- **shadcn-ui** components
- **React Router** for routing

### Backend
- **NestJS** (Node.js + TypeScript)
- **PostgreSQL** database
- **Prisma** ORM
- **JWT** authentication
- **Stripe** for payments
- **Google Meet API** for meeting links
- **Redis** for caching and notifications

### Deployment
- **Docker** and **Docker Compose** for containerization

## Features

### User Roles

#### Student
- Create and manage class request posts
- Browse teacher posts
- Send inquiries
- Select preferred time slots
- Make payments
- Confirm class completion

#### Teacher
- Upload verification documents (ID, qualifications)
- Create and manage class offering posts
- Respond to inquiries
- Provide available time slots
- Confirm bookings
- View wallet and payout history
- Confirm class completion

#### Admin
- Review and approve/reject teacher verification documents
- Moderate posts
- Handle disputes
- Manage users

### Core Features

- **Social Feed**: Unified feed similar to social media timeline
- **Posts**: Students post requests, teachers post offerings
- **Inquiries**: Private messaging between students and teachers
- **Booking System**: Time slot selection and confirmation
- **Payment Escrow**: Secure payment processing through Stripe
- **Virtual Wallet**: Teacher wallet with pending and released balances
- **Google Meet Integration**: Auto-generated meeting links
- **Location-Based Recommendations**: Prioritize nearby posts
- **Notifications**: In-app and email notifications

## Project Structure

```
MiniUni/
├── backend/                 # NestJS backend API
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # User management
│   │   ├── posts/         # Post management
│   │   ├── inquiries/     # Inquiry handling
│   │   ├── bookings/      # Booking management
│   │   ├── payments/      # Stripe integration
│   │   ├── wallets/       # Wallet management
│   │   ├── notifications/ # Notification system
│   │   ├── teachers/      # Teacher-specific features
│   │   ├── google-meet/   # Google Meet integration
│   │   └── prisma/        # Prisma service
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
├── src/                    # Frontend (React + Vite)
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom hooks
│   └── integrations/     # External integrations
├── docker-compose.yml     # Docker configuration
└── SETUP.md              # Detailed setup guide
```

## Quick Start

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (recommended)
- PostgreSQL 15+ (if not using Docker)
- Redis (if not using Docker)

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd MiniUni
```

2. **Start database and Redis (using Docker)**
```bash
docker-compose up -d postgres redis
```

3. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

4. **Setup Frontend**
```bash
# From project root
npm install
# Create .env file with VITE_API_URL=http://localhost:3000/api
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: Base user with role-based access
- **TeacherProfile**: Teacher information and verification
- **StudentProfile**: Student information
- **VerificationDocument**: Teacher verification documents
- **Post**: Student requests and teacher offerings
- **Inquiry**: Communication between users
- **TimeSlot**: Available time slots
- **Booking**: Confirmed class bookings
- **Payment**: Stripe payment records
- **Wallet**: Teacher virtual wallet
- **WalletTransaction**: Transaction history
- **Notification**: User notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user profile

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Inquiries
- `POST /api/inquiries` - Create inquiry
- `GET /api/inquiries` - Get user inquiries
- `PUT /api/inquiries/:id` - Update inquiry

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `PUT /api/bookings/:id/confirm` - Confirm completion

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/webhook` - Stripe webhook

### Wallets
- `GET /api/wallets/me` - Get wallet
- `GET /api/wallets/transactions` - Get transactions

See full API documentation at `/api/docs` when the backend is running.

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/miniuni"
JWT_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
REDIS_HOST="localhost"
REDIS_PORT="6379"
PORT=3000
FRONTEND_URL="http://localhost:8080"
```

### Frontend (.env)
```env
VITE_API_URL="http://localhost:3000/api"
```

## Development

### Running Migrations
```bash
cd backend
npm run prisma:migrate
```

### Generating Prisma Client
```bash
cd backend
npm run prisma:generate
```

### Seeding Database
```bash
cd backend
npm run prisma:seed
```

### Viewing Database
```bash
cd backend
npm run prisma:studio
```

## Production Deployment

1. Build Docker images:
```bash
docker-compose build
```

2. Start services:
```bash
docker-compose up -d
```

3. Run migrations:
```bash
docker-compose exec backend npm run prisma:migrate:deploy
```

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Stripe secure payment processing
- Input validation with class-validator
- SQL injection protection via Prisma

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
