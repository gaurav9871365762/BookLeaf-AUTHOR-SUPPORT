FROM node:22-bookworm-slim

WORKDIR /app

# Install native dependencies required for build
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests
COPY package.json package-lock.json ./

# Install all dependencies (including devDeps required for TypeScript build)
RUN npm ci

# Copy configuration and source files
COPY tsconfig.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY data/ ./data/

# Compile TypeScript
RUN npm run build

# Expose backend API port
EXPOSE 5000

# Start server
CMD ["node", "dist/src/server.js"]
