# OpenAPI/Swagger Documentation - Setup Guide

## Overview

The backend API now includes comprehensive OpenAPI 3.0 specification with interactive Swagger UI documentation.

## What's Included

✅ **Complete OpenAPI 3.0 Specification** (`src/backend/openapi.yaml`)

- All endpoints documented
- Request/response schemas
- Authentication requirements
- Error responses

✅ **Interactive Swagger UI**

- Test endpoints directly from browser
- Visual API explorer
- Downloadable specification

✅ **Documentation Files**

- `API_DOCS.md` - Comprehensive usage guide
- `openapi.yaml` - Raw OpenAPI specification
- `swagger.ts` - Swagger UI integration

## How to Run API Documentation

### Step 1: Install Dependencies

```bash
cd src/backend
npm install
```

Required packages:

- `swagger-ui-express` - UI for documentation
- `yamljs` - YAML parser
- TypeScript types for both

### Step 2: Start the Server

```bash
npm run dev
```

Server starts on `http://localhost:3000`

### Step 3: Access Documentation

Open your browser and navigate to:

```url
http://localhost:3000/api-docs
```

## Using Swagger UI

### Browse Endpoints

- Expand each section (Authentication, Products, Orders, etc.)
- View detailed endpoint information
- See required parameters and request body schemas

### Test Endpoints

1. Click on any endpoint
2. Click "Try it out" button
3. Fill in required parameters
4. Click "Execute"
5. View response in real-time

### Authentication Testing

1. First, use `/api/auth/login` to get a token
2. Copy the token from response
3. Click "Authorize" button (top right lock icon)
4. Paste token with "Bearer " prefix: `Bearer YOUR_TOKEN`
5. Click "Authorize" to use protected endpoints

### Download Specification

- **JSON Format**: Visit `http://localhost:3000/api-docs.json`
- **YAML Format**: Available at `src/backend/openapi.yaml`

## API Endpoints Summary

| Category | Endpoints | Auth Required |
| ---------- | ----------- | --------------- |
| **Authentication** | POST /register, POST /login | No |
| **Products** | GET /, GET /:id | No |
| **Categories** | GET / | No |
| **Tags** | GET / | No |
| **Orders** | GET /, POST / | GET requires auth |
| **Admin Products** | GET /, POST /, PUT /:id, DELETE /:id | Admin |
| **Admin Orders** | GET /, PATCH /:id/status | Admin |

## Default Credentials

**Admin User:**

- Email: `admin@welbeing.com`
- Password: `admin123`

**Test Users:**

- Email: `user1@welbeing.com` / Password: `user123`
- Email: `user2@welbeing.com` / Password: `user123`
- Email: `user3@welbeing.com` / Password: `user123`

## File Structure

```folder_structure
src/backend/
├── openapi.yaml           # OpenAPI 3.0 specification
├── API_DOCS.md           # Comprehensive API documentation
├── src/
│   ├── swagger.ts         # Swagger UI setup
│   └── app.ts           # Updated with Swagger routes
└── package.json          # Added Swagger dependencies
```

## Testing the Setup

After starting the server, verify Swagger is working:

```bash
# Check API docs endpoint
curl http://localhost:3000/api-docs

# Check JSON spec endpoint
curl http://localhost:3000/api-docs.json

# Verify server is running
curl http://localhost:3000/
```

## Customization

### Modify API Documentation

Edit `src/backend/openapi.yaml`:

- Add new endpoints
- Update schemas
- Change descriptions
- Add examples

After changes, restart server:

```bash
npm run dev
```

### Customize Swagger UI

Edit `src/backend/src/swagger.ts`:

```typescript
const swaggerOptions = {
  customSiteTitle: 'Your API Title',
  customCss: '.swagger-ui .topbar { display: none }',
  // Add more customizations
};
```

## Production Deployment

### Disable Swagger in Production

Update `src/backend/src/swagger.ts`:

```typescript
export const setupSwagger = (app: any) => {
  if (process.env.NODE_ENV === 'production') {
    return; // Skip Swagger in production
  }

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  // ...
};
```

### Use Separate Documentation Server

Alternatively, host Swagger on separate domain/subdomain:

- API: `api.welbeing.com`
- Docs: `docs.welbeing.com`

## Next Steps

1. ✅ Review OpenAPI specification
2. ✅ Test endpoints via Swagger UI
3. ✅ Integrate frontend with documented API
4. ✅ Generate client SDKs using [OpenAPI Generator](https://openapi-generator.tech/)
5. ✅ Add rate limiting and monitoring

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [API Documentation Guide](./API_DOCS.md)

---

**Need Help?** Check the full API documentation in `API_DOCS.md`
