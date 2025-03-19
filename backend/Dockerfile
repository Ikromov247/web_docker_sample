FROM ubuntu:24.04

# Set non-interactive installation mode
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js, npm and other dependencies
RUN apt-get update && \
    apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Check Node.js and npm versions
RUN node -v && npm -v

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install
RUN npm install mysql2@3.6.1

# Make sure node_modules isn't replaced by host volume
VOLUME ["/app/node_modules"]

# Copy application code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "start"]