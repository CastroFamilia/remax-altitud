FROM node:24-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build (avoids network calls + saves time)
ENV NEXT_TELEMETRY_DISABLED=1
# Give Node.js a generous heap — prevents OOM kills in memory-constrained
# Docker build environments (e.g. Coolify). Next.js + SWC + webpack can
# spike to 2–3 GB during compilation.
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN npm run build
RUN npm run scripts:build

FROM node:24-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Bundled scripts for server-side operations (migrate, sync)
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
# Migration SQL files needed by drizzle migrator at runtime
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db/migrations ./src/lib/db/migrations

# NOTE: /app/public/property-images requires a Docker volume mount for persistence
# across redeploys. Configure in Coolify / docker-compose as:
#   volumes:
#     - property_images:/app/public/property-images
RUN mkdir -p /app/public/property-images && chown nextjs:nodejs /app/public/property-images

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node dist/migrate.mjs && node server.js"]


