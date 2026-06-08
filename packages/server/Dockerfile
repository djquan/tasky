FROM node:26-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./

# Install dependencies
# Note: Using --no-frozen-lockfile because lockfile is at repo root
# This is safe since server has minimal dependencies (@y-sweet/sdk only)
RUN pnpm install --prod --no-frozen-lockfile

# Copy source code
COPY src ./src

EXPOSE 8092

CMD ["node", "src/index.js"]


