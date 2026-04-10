# --- STAGE 1: Build ---
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies (including optional ones for Rollup)
COPY package*.json ./
RUN npm ci

# Copy source & build
COPY . .
RUN npm run build

# --- STAGE 2: Serve with nginx ---
FROM nginx:stable-alpine

# Remove the default site config
RUN rm /etc/nginx/conf.d/default.conf

# Copy in your custom nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from the builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Run Nginx in the foreground (as root)
CMD ["nginx", "-g", "daemon off;"]
