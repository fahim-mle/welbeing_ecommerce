# Quickstart: Health and Wellbeing Ecommerce Store

## Prerequisites

- Node.js v20+
- npm

## Setup

1. **Install Dependencies**:
   ```bash
   # From root
   npm install
   ```

2. **Database Setup**:
   ```bash
   # Initialize SQLite database
   npx prisma migrate dev --name init
   # Seed database (Admin, Categories, Products)
   npx ts-node prisma/seed.ts
   ```

3. **Running Development Servers**:
   ```bash
   # Start Backend (API) - Port 3000
   npm run server:dev

   # Start Frontend (React/Vite) - Port 5173
   npm run client:dev
   ```

## Development

- **API Docs**: Open `specs/001-health-wellbeing-store/contracts/openapi.yaml`
- **Testing**:
  - Backend: `npm run test:backend`
  - Frontend: `npm run test:frontend`
