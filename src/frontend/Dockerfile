# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# VITE_API_BASE_URL is baked into the JS bundle at build time.
# Override this arg if the backend is reachable at a different URL.
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy all workspace manifests so npm ci can resolve the full lockfile
COPY package.json package-lock.json ./
COPY src/backend/package.json ./src/backend/
COPY src/frontend/package.json ./src/frontend/

# Install all workspace dependencies (uses root lock file)
RUN npm ci

# Copy frontend source
COPY src/frontend/ ./src/frontend/

# Build the Vite app
RUN cd src/frontend && npm run build

# ---- Serve with nginx ----
FROM nginx:alpine

COPY --from=builder /app/src/frontend/dist /usr/share/nginx/html
COPY src/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
