# Use Node.js 20 as the base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy server files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the server files
COPY . .

# Expose the server port
EXPOSE 5000

# Start the server in production mode
CMD ["node", "index.js"]