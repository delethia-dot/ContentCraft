FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy all source needed for server build
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle/ ./drizzle/
COPY tsconfig.json ./

# Build the server bundle
RUN pnpm exec esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
