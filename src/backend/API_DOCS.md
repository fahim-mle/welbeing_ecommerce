# Health & Wellbeing E-Commerce API Documentation

## Overview

This is the comprehensive API documentation for the Health and Wellbeing E-Commerce platform backend. The API provides endpoints for product catalog management, user authentication, order processing, and admin operations.

## Quick Start

### 1. Install Dependencies

```bash
cd src/backend
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the `src/backend` directory:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-here"
PORT=3000
NODE_ENV=development
```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

### 4. Seed the Database

```bash
npm run db:seed
```

This creates sample data including:

- Product categories (Supports, Braces, Supplements, Equipment, Therapy)
- Wellbeing tags (Joint Pain, Sleep Support, Mobility, etc.)
- Sample products
- Admin user (`admin@welbeing.com` / `admin123`)
- Test users

### 5. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 6. Access API Documentation

Open your browser and navigate to:

```link
http://localhost:3000/api-docs
```

This will display the interactive Swagger UI where you can:

- Browse all available endpoints
- See request/response schemas
- Test API endpoints directly from the browser
- Download the OpenAPI specification

## API Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://api.welbeing.com`

## Authentication

### Register a New User

**POST** `/api/auth/register`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "2c9d3c3f-9d5e-4f1d-a9b6-0aa8e9a6a4c1",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### Login

**POST** `/api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "2c9d3c3f-9d5e-4f1d-a9b6-0aa8e9a6a4c1",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "USER"
  }
}
```

Additional auth flows:

- `POST /api/auth/refresh-token` - Rotate refresh token
- `POST /api/auth/logout` - Revoke refresh token
- `POST /api/auth/verify-email` - Request verification email
- `GET /api/auth/verify-email/:token` - Confirm verification
- `POST /api/auth/forgot-password` - Request reset email
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/oauth/:provider` - OAuth login

### Using Authenticated Endpoints

Include the JWT token in the Authorization header:

```bash
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Available Endpoints

### Public Endpoints

#### Health

- `GET /api/health` - Service health check

#### Products

- `GET /api/products` - List products with optional filtering
- `GET /api/products/:id` - Get product details

#### Metadata

- `GET /api/categories` - List all categories
- `GET /api/tags` - List all wellbeing tags

#### Orders (Guest)

- `POST /api/orders` - Create a guest order

#### Authentication API List

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Rotate refresh token
- `POST /api/auth/logout` - Revoke refresh token
- `POST /api/auth/verify-email` - Request email verification
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/oauth/:provider` - OAuth login (google/github)

### Authenticated Endpoints (Require JWT)

#### User Profile

- `GET /api/me` - Get current profile
- `PUT /api/me` - Update profile
- `PUT /api/me/password` - Update password

#### Addresses

- `GET /api/addresses` - List saved addresses
- `POST /api/addresses` - Create new address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

#### Orders

- `GET /api/orders` - Get authenticated user's orders
- `GET /api/orders/:id` - Get order detail
- `POST /api/orders/:id/cancel` - Cancel order

### Admin Endpoints (Require JWT + ADMIN role)

> **Default Admin Credentials**
> Email: `admin@welbeing.com`
> Password: `admin123`

#### Products API List

- `GET /api/admin/products` - List all products (including hidden)
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

#### Orders API List

- `GET /api/admin/orders` - List all orders
- `PATCH /api/admin/orders/:id/status` - Update order status

#### Catalog

- `POST /api/admin/catalog/categories` - Create category
- `PUT /api/admin/catalog/categories/:id` - Update category
- `DELETE /api/admin/catalog/categories/:id` - Delete category
- `POST /api/admin/catalog/tags` - Create tag
- `PUT /api/admin/catalog/tags/:id` - Update tag
- `DELETE /api/admin/catalog/tags/:id` - Delete tag

#### Users

- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/:id` - Update user role/status

#### Analytics

- `GET /api/admin/analytics/dashboard` - Dashboard stats

## Common Usage Examples

### Browse Products

```bash
# Get all products
curl http://localhost:3000/api/products

# Filter by category
curl http://localhost:3000/api/products?category=1

# Filter by tag
curl http://localhost:3000/api/products?tag=1

# Search products
curl http://localhost:3000/api/products?search=knee

# Get specific product
curl http://localhost:3000/api/products/1
```

### Create Order

**Guest Order:**

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "guest_email": "guest@example.com",
    "items": [
      {
        "product_id": 1,
        "quantity": 2
      }
    ],
    "shipping_address": {
      "label": "Home",
      "full_name": "Guest User",
      "phone": "1234567890",
      "street_line_1": "123 Wellness Ave",
      "street_line_2": "Apt 4B",
      "city": "Austin",
      "state": "TX",
      "postal_code": "73301",
      "country": "US"
    },
    "payment_placeholder": "Card ending in 4242",
    "disclaimer_accepted": true
  }'
```

**Authenticated Order:**

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [
      {
        "product_id": 1,
        "quantity": 2
      }
    ],
    "address_id": 3,
    "payment_placeholder": "Card ending in 4242",
    "disclaimer_accepted": true
  }'
```

### Create Product (Admin)

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "name": "New Product",
    "description": "Product description",
    "price": 29.99,
    "categoryId": 1,
    "stockQuantity": 10,
    "isVisible": true,
    "imageUrls": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "tagIds": [1, 2]
  }'
```

## Error Handling

All errors follow a consistent format:

```json
{
  "message": "Error description",
  "error": "Detailed error information (optional)"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test tests/integration/products.test.ts
npm test tests/unit/auth.test.ts
```

### Run Backend Tests

```bash
npm test -- --testPathPattern=tests/
```

## Development

### Build TypeScript

```bash
npm run build
```

### Watch Mode (Development)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## Database Management

### View Database

```bash
npm run prisma studio
```

This opens Prisma Studio to view and edit your database.

### Reset Database

```bash
npm run prisma migrate reset
npm run db:seed
```

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:

- **JSON**: `http://localhost:3000/api-docs.json`
- **YAML**: `src/backend/openapi.yaml`

You can download the specification and use it to generate client SDKs in various languages using the [OpenAPI Generator](https://openapi-generator.tech/).

## Security Notes

1. **JWT Tokens**: Store tokens securely (e.g., in httpOnly cookies or secure storage)
2. **Password Hashing**: All passwords are hashed using bcrypt
3. **CORS**: Configure CORS properly for production
4. **Rate Limiting**: Consider adding rate limiting for production
5. **HTTPS**: Always use HTTPS in production
6. **Environment Variables**: Never commit `.env` files

## Support

For issues or questions:

- Check the API docs: `http://localhost:3000/api-docs`
- Review test files in `tests/`
- Open an issue on GitHub

## License

MIT
