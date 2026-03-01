FROM node:20-slim

WORKDIR /app

# Install dependencies needed for some node-modules if any
# RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Default command is to run the server
CMD ["node", "dist/server.js"]
