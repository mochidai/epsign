FROM mcr.microsoft.com/playwright:v1.49.1-jammy

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/dashboard/package.json ./packages/dashboard/package.json

RUN npm install
RUN npm install @rollup/rollup-linux-arm64-gnu --save-optional

COPY . .

WORKDIR /app/packages/dashboard

RUN npm run build

ENV PORT=3000
ENV SERVER_PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]