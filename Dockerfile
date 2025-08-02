# Use Node.js 18 with Python3 pre-installed
FROM node:18-bullseye

# Install Python3 and pip (they should already be in bullseye, but let's ensure)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Create symlink for python3 to python if needed
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Start the payment server
CMD ["npm", "run", "payment-server:prod"]