FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./

# Install dependencies
RUN pnpm install --prod

# Copy source code
COPY src ./src

EXPOSE 3001

CMD ["node", "src/index.js"]


