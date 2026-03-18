# Health & Wellbeing E-Commerce Platform

A full-stack, production-ready e-commerce platform built with TypeScript, featuring a comprehensive product catalog for health and wellbeing products, secure authentication with multi-factor authentication (MFA), and a complete admin dashboard.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Documentation](#-documentation)
- [Testing](#-testing)
- [Security](#-security)
- [Deployment](#-deployment)
- [API Endpoints](#-api-endpoints)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

The Health & Wellbeing E-Commerce Platform is a modern, scalable e-commerce solution designed specifically for health and wellness products. It provides a seamless shopping experience for customers while offering powerful management tools for administrators.

**Key Highlights:**

- 🛡️ **Enterprise-grade Security** - JWT authentication with TOTP-based MFA
- 🎨 **Modern UI/UX** - Responsive design with Tailwind CSS
- 📱 **Mobile-First** - Optimized for all devices
- 🔍 **Advanced Search** - Filter by category, tags, and keywords
- 🛒 **Guest Checkout** - No account required for purchases
- 📊 **Admin Dashboard** - Complete order and product management
- 📖 **API Documentation** - Interactive Swagger UI
- ✅ **Comprehensive Testing** - Unit and integration tests

---

## ✨ Features

### Customer Features

- ✅ **Product Catalog**
  - Browse products by category (Supplements, Fitness, Mental Health, etc.)
  - Filter by wellbeing tags (Sleep, Energy, Immunity, etc.)
  - Search by name or description
  - Multi-image product galleries
  - Detailed product information (ingredients, benefits, usage)

- ✅ **Shopping Experience**
  - Guest checkout (no account required)
  - User accounts with order history
  - Secure payment simulation (Stripe/PayPal/COD)
  - Real-time order tracking
  - Address management

- ✅ **User Authentication**
  - Email/password registration and login
  - JWT-based session management
  - httpOnly cookie security
  - Optional Multi-Factor Authentication (TOTP)
  - Password reset functionality

### Admin Features

- ✅ **Product Management**
  - Create, update, and delete products
  - Manage product images
  - Set pricing and inventory
  - Category and tag assignment
  - Bulk operations

- ✅ **Order Management**
  - View all orders with filters
  - Update order status (Pending → Paid → Shipped → Delivered)
  - Track payment status
  - Shipping information management
  - Order history and analytics

- ✅ **User Management**
  - View all users
  - Manage user roles (USER/ADMIN)
  - Activate/deactivate accounts
  - Reset user MFA (emergency access)

- ✅ **Security**
  - **Required MFA for Admins** - TOTP-based two-factor authentication
  - Audit logging for sensitive actions
  - Role-based access control (RBAC)
  - Secure session management

### Developer Features

- ✅ **API Documentation**
  - Interactive Swagger UI
  - OpenAPI 3.0 specification
  - Comprehensive endpoint examples
  - Request/response schemas

- ✅ **Testing**
  - Unit tests (Jest/Vitest)
  - Integration tests
  - 80+ test cases
  - Continuous integration ready

- ✅ **Code Quality**
  - TypeScript strict mode
  - ESLint configuration
  - Consistent code style
  - Git hooks (optional)

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose | Version |
| ------------ | --------- | --------- |
| **Node.js** | Runtime environment | 18+ |
| **Express.js** | Web framework | 4.x |
| **TypeScript** | Type safety | 5.x |
| **Prisma** | ORM & database toolkit | 6.x |
| **PostgreSQL** | Relational database | 15+ |
| **JWT** | Authentication tokens | jsonwebtoken |
| **bcryptjs** | Password hashing | 2.x |
| **otplib** | TOTP generation | 13.x |
| **qrcode** | QR code generation | 1.x |
| **Swagger UI** | API documentation | swagger-ui-express |
| **Jest** | Testing framework | 29.x |

### Frontend

| Technology | Purpose | Version |
| ------------ | --------- | --------- |
| **React** | UI library | 19.x |
| **TypeScript** | Type safety | 5.x |
| **Vite** | Build tool | 7.x |
| **React Router** | Routing | 7.x |
| **Tailwind CSS** | Styling | 3.x |
| **Lucide React** | Icons | Latest |
| **Vitest** | Testing framework | Latest |

### DevOps & Tools

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy (production)
- **ESLint** - Code linting
- **Prettier** - Code formatting (optional)

---

## 📁 Project Structure

```s
welbeing_ecommerce/
├── src/
│   ├── backend/                    # Express.js backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database schema
│   │   │   ├── migrations/        # Database migrations
│   │   │   └── seed.ts            # Seed data
│   │   ├── src/
│   │   │   ├── api/               # API routes
│   │   │   │   ├── auth.ts        # Authentication endpoints
│   │   │   │   ├── mfa.ts         # MFA endpoints
│   │   │   │   ├── products.ts    # Product endpoints
│   │   │   │   ├── orders.ts      # Order endpoints
│   │   │   │   └── admin/         # Admin-only endpoints
│   │   │   ├── services/          # Business logic
│   │   │   │   ├── userService.ts
│   │   │   │   ├── orderService.ts
│   │   │   │   └── catalogService.ts
│   │   │   ├── middleware/        # Express middleware
│   │   │   │   ├── auth.ts        # JWT authentication
│   │   │   │   ├── adminAuth.ts   # Admin + MFA enforcement
│   │   │   │   └── validation.ts  # Request validation
│   │   │   ├── lib/               # Utilities
│   │   │   │   ├── prisma.ts      # Prisma client
│   │   │   │   ├── auth.ts        # JWT utilities
│   │   │   │   ├── mfa.ts         # TOTP utilities
│   │   │   │   └── cookie.ts      # Cookie configuration
│   │   │   └── app.ts             # Express app setup
│   │   ├── tests/
│   │   │   ├── unit/              # Unit tests
│   │   │   └── integration/       # Integration tests
│   │   ├── openapi.yaml           # OpenAPI specification
│   │   ├── API_DOCS.md            # API documentation
│   │   └── package.json
│   │
│   └── frontend/                   # React frontend
│       ├── src/
│       │   ├── api/               # API client functions
│       │   │   ├── auth.ts
│       │   │   ├── mfa.ts
│       │   │   ├── admin.ts
│       │   │   └── catalog.ts
│       │   ├── components/        # React components
│       │   │   ├── MfaEnrollmentModal.tsx
│       │   │   ├── BackupCodesModal.tsx
│       │   │   └── admin/         # Admin components
│       │   ├── pages/             # Page components
│       │   │   ├── Home.tsx
│       │   │   ├── Auth.tsx       # Login/Register
│       │   │   ├── Profile.tsx
│       │   │   └── admin/         # Admin pages
│       │   ├── context/           # React contexts
│       │   │   ├── AuthContext.tsx
│       │   │   └── CartContext.tsx
│       │   └── config.ts          # Configuration
│       └── package.json
│
├── docs/                          # Documentation
│   ├── MFA_SETUP.md              # MFA setup guide
│   └── SECURITY.md               # Security guidelines
│
├── specs/                         # Project specifications
│   └── 001-health-wellbeing-store/
│
├── compose.yaml                   # Docker Compose config
├── .env.docker.example           # Docker environment template
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**
- **PostgreSQL** 15+ (or use Docker)
- **Redis** (optional, for caching)

### Installation

#### Option 1: Local Development

**1. Clone the repository** -

```bash
git clone <repository-url>
cd welbeing_ecommerce
```

**2. Install dependencies** -

```bash
# Install all dependencies (root + backend + frontend)
npm run install:all

# Or install individually
cd src/backend && npm install
cd src/frontend && npm install
```

**3. Set up environment variables** -

**Backend** (`src/backend/.env`):

```env
# Database
DATABASE_URL="postgresql://welbeing:welbeing@localhost:5432/welbeing?schema=public"

# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# CORS (for frontend)
CORS_ORIGIN="http://localhost:5173"

# Optional
REDIS_URL="redis://localhost:6379"
```

**Frontend** (`src/frontend/.env.local`):

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**4. Initialize the database** -

```bash
cd src/backend

# Run migrations and seed data
npm run db:init

# Or manually
npx prisma migrate dev
npx prisma db seed
```

**5. Start development servers** -

**Terminal 1 - Backend:**

```bash
cd src/backend
npm run dev
```

Backend runs on `http://localhost:3000`

**Terminal 2 - Frontend:** -

```bash
cd src/frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

**6. Access the application**-

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:3000/api>
- **API Docs**: <http://localhost:3000/api-docs>

---

#### Option 2: Docker Deployment

**1. Copy environment file** -

```bash
cp .env.docker.example .env.docker
```

**2. Edit `.env.docker` and set secure values** -

```env
# IMPORTANT: Change these values!
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-super-secret-jwt-key
```

**3. Start all services** -

```bash
docker-compose up -d
```

**4. Access the application**  -

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:3000/api>
- **API Docs**: <http://localhost:3000/api-docs>

**5. View logs** -

```bash
docker-compose logs -f
```

**6. Stop services** -

```bash
docker-compose down
```

---

### Default Credentials

**Admin Account:**

- Email: `admin@welbeing.com`
- Password: `admin123`
- **Note**: Enable MFA after first login (required for admin access)

**Test User Accounts:**

- `user1@welbeing.com` / `user123`
- `user2@welbeing.com` / `user123`
- `user3@welbeing.com` / `user123`

⚠️ **Security Warning**: Change default passwords in production!

---

## 📖 Documentation

### Quick Links

- 📖 [API Documentation](./src/backend/API_DOCS.md) - Comprehensive API usage guide
- 🔐 [MFA Setup Guide](./docs/MFA_SETUP.md) - Multi-factor authentication setup
- 🚀 [Swagger UI](http://localhost:3000/api-docs) - Interactive API testing
- 📋 [Project Tasks](./specs/001-health-wellbeing-store/tasks.md) - Development progress

### API Documentation

**Interactive Swagger UI:**

```api
http://localhost:3000/api-docs
```

Features:

- Browse all endpoints
- View request/response schemas
- Test endpoints directly from browser
- Download OpenAPI specification

**OpenAPI Specification:**

- **JSON**: `http://localhost:3000/api-docs.json`
- **YAML**: `src/backend/openapi.yaml`

**Detailed Guides:**

- [API_DOCS.md](./src/backend/API_DOCS.md) - All endpoints with examples
- [MFA_SETUP.md](./docs/MFA_SETUP.md) - MFA enrollment and usage

---

## 🧪 Testing

### Backend Tests

```bash
cd src/backend

# Run all tests
npm test

# Run unit tests only
TEST_DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy \
  npx jest tests/unit/ --no-coverage --no-globalSetup

# Run integration tests (requires test database)
npx jest tests/integration/

# Run with coverage
npm run test:coverage
```

**Test Coverage:**

- Unit tests: 83 tests
- Integration tests: 42 tests
- Total: 125+ tests

### Frontend Tests

```bash
cd src/frontend

# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Run All Tests

```bash
# From project root
npm run test:all
```

---

## 🔒 Security

### Authentication & Authorization

**JWT-based Authentication:**

- Access tokens (15 min expiry) stored in httpOnly cookies
- Refresh tokens (7 days expiry) for session renewal
- Secure cookie configuration (httpOnly, SameSite, Secure in production)

**Multi-Factor Authentication (MFA):**

- TOTP-based (RFC 6238) compatible with Google Authenticator, Authy, etc.
- **Required for all admin accounts**
- QR code enrollment
- 10 single-use backup codes
- Admin can reset user MFA in emergencies

**Role-Based Access Control:**

- `USER` role - Standard customer access
- `ADMIN` role - Full dashboard access (requires MFA)

### Security Best Practices

✅ **Password Security**

- bcrypt hashing with salt rounds
- Minimum password requirements
- Password reset via email tokens

✅ **Session Security**

- httpOnly cookies (not accessible via JavaScript)
- CSRF protection via SameSite cookies
- Short-lived access tokens
- Refresh token rotation

✅ **API Security**

- Rate limiting on authentication endpoints
- Input validation with Zod schemas
- SQL injection prevention (Prisma ORM)
- XSS protection

✅ **MFA Security**

- TOTP secrets encrypted in database
- Backup codes hashed (SHA-256)
- Single-use backup codes
- 5-minute MFA token expiry

For detailed MFA setup, see [MFA_SETUP.md](./docs/MFA_SETUP.md)

---

## 🚢 Deployment

### Environment Variables

**Backend (Production):**

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-key-min-32-chars
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com
```

**Frontend (Production):**

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Build for Production

**Backend:**

```bash
cd src/backend
npm run build
npm start
```

**Frontend:**

```bash
cd src/frontend
npm run build
# Output in dist/ directory
```

### Docker Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Deployment Checklist

- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Use production database credentials
- [ ] Enable HTTPS/SSL
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Review and update default admin password
- [ ] Enable MFA for all admin accounts
- [ ] Set up rate limiting
- [ ] Configure CDN for static assets (optional)

---

## 📡 API Endpoints

### Public Endpoints

**Products:**

- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - List categories
- `GET /api/tags` - List wellbeing tags

**Authentication:**

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns MFA token if enabled)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

**Orders:**

- `POST /api/orders` - Create order (guest or authenticated)

### Authenticated Endpoints

**User:**

- `GET /api/auth/me` - Get current user
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `GET /api/addresses` - Get user's addresses
- `POST /api/addresses` - Create address

**MFA:**

- `POST /api/auth/mfa/enroll` - Start MFA enrollment
- `POST /api/auth/mfa/verify-enrollment` - Complete MFA enrollment
- `GET /api/auth/mfa/status` - Get MFA status
- `POST /api/auth/mfa/verify` - Verify TOTP during login
- `POST /api/auth/mfa/verify-backup-code` - Verify backup code
- `POST /api/auth/mfa/regenerate-backup-codes` - Generate new backup codes

### Admin Endpoints (Requires ADMIN role + MFA)

**Products:**

- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

**Orders:**

- `GET /api/admin/orders` - List all orders
- `GET /api/admin/orders/:id` - Get order details
- `PATCH /api/admin/orders/:id/status` - Update order status

**Users:**

- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/role` - Update user role
- `PATCH /api/admin/users/:id/status` - Activate/deactivate user
- `POST /api/auth/mfa/reset` - Reset user's MFA

For detailed API documentation with examples, see [API_DOCS.md](./src/backend/API_DOCS.md)

---

## 🗄️ Database Management

### Prisma Studio (Database GUI)

```bash
cd src/backend
npm run prisma studio
```

Access at `http://localhost:5555`

### Database Commands

```bash
cd src/backend

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

---

## 🔧 Development

### Linting

**Backend:**

```bash
cd src/backend
npm run lint
```

**Frontend:**

```bash
cd src/frontend
npm run lint
```

### Code Style

- **TypeScript** strict mode enabled
- **ESLint** for code quality
- **Prettier** (optional) for formatting
- **Conventional Commits** recommended

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```txt
feat: add new feature
fix: resolve bug
docs: update documentation
test: add tests
refactor: refactor code
chore: update dependencies
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/), [Express](https://expressjs.com/), and [Prisma](https://www.prisma.io/)
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- MFA powered by [otplib](https://github.com/yeojz/otplib)

---

## 📞 Support

- 📖 [API Documentation](./src/backend/API_DOCS.md)
- 🔐 [MFA Setup Guide](./docs/MFA_SETUP.md)
- 🚀 [Swagger UI](http://localhost:3000/api-docs)
- 📋 [Project Tasks](./specs/001-health-wellbeing-store/tasks.md)
- 🐛 [Report Issues](https://github.com/fahim-mle/welbeing_ecommerce/issues)

---

**Built with ❤️ for Health & Wellbeing** -

Last Updated: March 2026 | Version: 1.0.0
