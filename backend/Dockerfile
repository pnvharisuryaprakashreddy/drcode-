FROM node:20-alpine AS build

WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Puppeteer templates must exist in the runtime dist folder.
RUN mkdir -p dist/templates && cp -R src/templates dist/templates

FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache chromium nss freetype ttf-freefont

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

ENV PORT=3001
ENV UPLOAD_DIR=/app/uploads
ENV GENERATED_DIR=/app/generated

RUN mkdir -p /app/uploads /app/generated

EXPOSE 3001

CMD ["node", "dist/index.js"]

