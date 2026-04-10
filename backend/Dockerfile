# Stage 1: Build dependencies and compile
FROM node:20-slim AS builder
WORKDIR /usr/src/app

# Install Node.js dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . ./
RUN npm run build

# Stage 2: Runtime environment
FROM node:20-slim
LABEL maintainer="Max Spector <maxspectorr@gmail.com>"
WORKDIR /usr/src/app

# Install production Node.js dependencies
COPY --from=builder /usr/src/app/package*.json ./
RUN npm install --only=production

# Copy compiled application and EJS templates
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/views ./views

# Install Chromium, fonts (including Hebrew support), and required libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      chromium \
      fonts-dejavu-core \
      fonts-dejavu-extra \
      fonts-liberation \
      libasound2 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libdrm2 \
      libgbm1 \
      libgtk-3-0 \
      libpango-1.0-0 \
      libx11-xcb1 \
      libxcomposite1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxrandr2 \
      libxrender1 \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Configure Puppeteer to use the system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

# Expose application port and start
EXPOSE 5020
CMD ["node", "dist/index.js"]
