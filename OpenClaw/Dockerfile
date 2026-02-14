# OpenClaw Dockerfile for Coolify Deployment

FROM node:20-alpine

# Install required system packages
RUN apk add --no-cache \
    bash \
    ca-certificates \
    curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S openclaw && \
    adduser -S openclaw -u 1001 -G openclaw

# Create data directories (will be mounted as volumes)
RUN mkdir -p /srv/data/{inbox,clients,logs,backups} && \
    chown -R openclaw:openclaw /srv/data

# Switch to non-root user
USER openclaw

# Expose port if OpenClaw has a web interface (optional)
# EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Start OpenClaw
CMD ["node", "dist/index.js"]
