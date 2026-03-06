# PrepOpening API — production image for Railway
# Use slim (Debian) not alpine: bcrypt native bindings fail on Alpine
FROM node:22-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production run
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/server.js"]
