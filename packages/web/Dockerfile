# Multi-stage build for Tasky web app
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./

# Copy shared package (needed for build)
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

# Copy web package files
COPY packages/web/package.json ./packages/web/
COPY packages/web/tsconfig.json ./packages/web/
COPY packages/web/tsconfig.node.json ./packages/web/
COPY packages/web/vite.config.ts ./packages/web/
COPY packages/web/postcss.config.js ./packages/web/
COPY packages/web/index.html ./packages/web/
COPY packages/web/public ./packages/web/public
COPY packages/web/src ./packages/web/src

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the app
WORKDIR /app/packages/web
RUN pnpm build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# Fix file permissions so nginx can read all files
RUN chmod -R 644 /usr/share/nginx/html/* && \
    find /usr/share/nginx/html -type d -exec chmod 755 {} \;

# Configure MIME types for SVG and other assets
RUN echo 'types { \
    text/html html htm shtml; \
    text/css css; \
    text/xml xml; \
    image/gif gif; \
    image/jpeg jpeg jpg; \
    image/png png; \
    image/svg+xml svg svgz; \
    application/javascript js; \
    application/json json; \
    application/woff woff; \
    application/woff2 woff2; \
    font/ttf ttf; \
    font/eot eot; \
    }' > /etc/nginx/mime.types

# Create nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json image/svg+xml; \
    \
    # Handle dev service worker requests gracefully (for production builds) \
    location = /dev-sw.js { \
    return 204; \
    add_header Content-Length 0; \
    } \
    \
    # Cache static assets \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
    expires 1y; \
    add_header Cache-Control "public, immutable"; \
    } \
    \
    # SPA routing - serve index.html for all routes \
    location / { \
    try_files $uri $uri/ /index.html; \
    add_header Cache-Control "no-cache"; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

