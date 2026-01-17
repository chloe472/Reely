# Use Node.js 18 LTS
FROM node:18-alpine

# Install ffmpeg for video processing
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p uploads/frames

# Expose port (Cloud Run will use PORT env variable)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
