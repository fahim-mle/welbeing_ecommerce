# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy all workspace manifests so npm ci can resolve the full lockfile
COPY package.json package-lock.json ./
COPY src/backend/package.json ./src/backend/
COPY src/frontend/package.json ./src/frontend/

# Install all workspace dependencies (uses root lock file)
RUN npm ci

# Copy backend source
COPY src/backend/ ./src/backend/

# Generate Prisma client and compile TypeScript
RUN cd src/backend && npx prisma generate && npm run build

# swagger.ts compiles to dist/src/swagger.js and loads:
#   path.join(__dirname, '../openapi.yaml')  =>  dist/openapi.yaml
# Copy the spec to that location so it is available at runtime.
RUN cp src/backend/openapi.yaml src/backend/dist/openapi.yaml

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# prisma is a devDependency of the backend workspace so npm does NOT hoist it
# to the root node_modules — it stays in src/backend/node_modules/.bin/.
# Include both locations in PATH so the binary is found regardless.
ENV PATH="/app/src/backend/node_modules/.bin:/app/node_modules/.bin:${PATH}"

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/backend/node_modules ./src/backend/node_modules
COPY --from=builder /app/src/backend/dist ./src/backend/dist
COPY --from=builder /app/src/backend/prisma ./src/backend/prisma

EXPOSE 3000

# Apply any pending migrations then start the server
CMD ["sh", "-c", \
  "prisma migrate deploy --schema=src/backend/prisma/schema.prisma \
  && node src/backend/dist/src/app.js"]
