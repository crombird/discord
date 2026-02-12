FROM oven/bun:latest

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json ./
COPY bun.lock ./
RUN bun install --production --frozen-lockfile

# Copy app code
COPY ./src ./src/

# Start the app
CMD ["bun", "start"]
