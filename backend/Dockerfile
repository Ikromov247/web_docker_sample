FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Install dependencies with explicit mysql2
RUN npm install 
RUN npm install mysql2@3.6.1

# Make sure node_modules isn't replaced by host volume
VOLUME ["/app/node_modules"]

# Copy application code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "start"]