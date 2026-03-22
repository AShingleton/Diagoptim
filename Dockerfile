FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
CMD ["npx", "tsx", "workers/index.ts"]
