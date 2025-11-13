# Update base image to Node.js 20
FROM node:20 AS base

# Set working directory for the server
WORKDIR /app/server

# Copy server files
COPY server/package.json server/package-lock.json ./

# Install server dependencies
RUN npm install

# Copy the rest of the server files
COPY server/ ./

# Set working directory for the client
WORKDIR /app/client

# Copy client files
COPY client/package.json client/package-lock.json ./

# Install client dependencies
RUN npm install

# Copy the rest of the client files
COPY client/ ./

# Expose ports for client and server
EXPOSE 3000 5173

# Start both client and server
CMD ["sh", "-c", "cd /app/server && npm run dev & cd /app/client && npm run dev"]