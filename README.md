# Health & Wellbeing E-Commerce Platform

Full-stack TypeScript e-commerce platform for health and wellbeing products with comprehensive API documentation.

## Quick Links

- 📖 [API Documentation Guide](./src/backend/API_DOCS.md) - Comprehensive API usage examples
- 🚀 [Swagger Setup Guide](./SWAGGER_SETUP.md) - How to use interactive API docs
- 📋 [Project Tasks](./specs/001-health-wellbeing-store/tasks.md) - Development progress tracking

## Features

- ✅ Product catalog with categories and wellbeing tags
- ✅ Multi-image product support
- ✅ Guest checkout flow with simulated payment
- ✅ User authentication (JWT) with multi-provider identity support
- ✅ Admin dashboard for product and order management
- ✅ Order history for authenticated users
- ✅ Comprehensive OpenAPI/Swagger documentation
- ✅ Full test coverage (frontend + backend)

## Project Structure

```
welbeing_ecommerce/
├── src/
│   ├── frontend/          # React + Vite + TypeScript
│   │   ├── src/
│   │   │   ├── api/      # API client functions
│   │   │   ├── components/ # React components
│   │   │   ├── pages/     # Page components
│   │   │   └── context/   # React contexts (Auth, Cart)
│   │   └── package.json
│   │
│   └── backend/           # Express + TypeScript + Prisma
│       ├── prisma/         # Database schema & migrations
│       ├── src/
│       │   ├── api/       # API routes
│       │   ├── services/   # Business logic
│       │   ├── middleware/  # Auth, error handling
│       │   └── lib/       # Utilities (Prisma, Auth)
│       ├── tests/          # Jest tests
│       ├── openapi.yaml    # OpenAPI 3.0 spec
│       ├── API_DOCS.md     # API documentation
│       └── package.json
│
└── specs/                 # Project specifications
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Install Dependencies

```bash
# Backend
cd src/backend
npm install

# Frontend
cd src/frontend
npm install
```

### 2. Set Up Environment

**Backend** (`src/backend/.env`):
```env
# Postgres (dev)
DATABASE_URL="postgresql://welbeing:welbeing@localhost:5432/test_welbeing?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3000
NODE_ENV=development
JWT_SECRET="your-secret-key-here"
```

**Frontend** (`src/frontend/.env.local`):
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Initialize Database

```bash
cd src/backend

# Initialize local DB schema (recommended)
npm run db:init

# Alternatively, if you prefer migrations (may require cleanup of old migration history)
# npm run db:migrate
# npm run db:seed
```

### 4. Start Servers

**Backend (in one terminal)**:
```bash
cd src/backend
npm run dev
```

Backend runs on `http://localhost:3000`

**Frontend (in another terminal)**:
```bash
cd src/frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

## API Documentation

### Interactive Swagger UI

Once the backend server is running, access interactive API documentation:

```
http://localhost:3000/api-docs
```

Features:
- Browse all endpoints
- View request/response schemas
- Test endpoints directly from browser
- Download OpenAPI specification

### Raw OpenAPI Spec

- **JSON**: `http://localhost:3000/api-docs.json`
- **YAML**: `src/backend/openapi.yaml`

### Detailed Documentation

See [src/backend/API_DOCS.md](./src/backend/API_DOCS.md) for:
- All endpoints with examples
- Authentication flow
- Error handling
- Usage patterns

## Default Credentials

**Admin**:
- Email: `admin@welbeing.com`
- Password: `admin123`

**Test Users**:
- `user1@welbeing.com` / `user123`
- `user2@welbeing.com` / `user123`
- `user3@welbeing.com` / `user123`

## Testing

### Backend Tests
```bash
cd src/backend
npm test
```

### Frontend Tests
```bash
cd src/frontend
npm test
```

### Run All Tests
```bash
npm run test:all
```

## Database Management

### View Database
```bash
cd src/backend
npm run prisma studio
```

### Reset Database
```bash
cd src/backend
npm run prisma migrate reset
npm run db:seed
```

## Tech Stack

**Backend**:
- Express.js
- TypeScript
- Prisma ORM
- SQLite
- JWT Authentication
- bcryptjs
- Swagger UI / OpenAPI

**Frontend**:
- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Vitest

## API Endpoints

### Public
- `GET /api/products` - List products (filter by category, tag, search)
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - List categories
- `GET /api/tags` - List wellbeing tags
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/orders` - Create guest order

### Authenticated
- `GET /api/orders` - Get user's orders

### Admin (requires ADMIN role)
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - List all orders
- `PATCH /api/admin/orders/:id/status` - Update order status

## Development

### Build Commands

**Backend**:
```bash
npm run build      # Compile TypeScript
npm start          # Run production build
```

**Frontend**:
```bash
npm run build      # Build for production
npm run preview    # Preview production build
```

### Linting

**Backend**:
```bash
cd src/backend
npm run lint
```

**Frontend**:
```bash
cd src/frontend
npm run lint
```

## Deployment

### Environment Variables

Set these before deploying:

**Backend**:
- `DATABASE_URL` - Production database connection
- `JWT_SECRET` - Strong secret key
- `NODE_ENV=production`

**Frontend**:
- `VITE_API_BASE_URL` - Production API URL

### Build & Deploy

```bash
# Build backend
cd src/backend
npm run build

# Build frontend
cd src/frontend
npm run build

# Deploy dist/ directories to your hosting platform
```

## License

MIT

## Support

- 📖 [API Documentation](./src/backend/API_DOCS.md)
- 🚀 [Swagger Setup](./SWAGGER_SETUP.md)
- 📋 [Tasks & Progress](./specs/001-health-wellbeing-store/tasks.md)
