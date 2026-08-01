FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Note: modern npm uses --omit=dev instead of --only=production
# RUN npm install --omit=dev && npm cache clean --force

COPY src/ ./src/
COPY public/ ./public/

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/healthz || exit 1

CMD ["node", "src/app.js"]