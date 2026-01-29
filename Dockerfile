# Use official Node.js 20 LTS Alpine (pinned minor for reproducibility and security)
FROM node:20-alpine3.20 AS base

# Install dependencies only when needed
FROM base AS deps
# See https://github.com/nodejs/docker-node/tree/main#nodealpine (libc6-compat for some native deps)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry; enable standalone output for Docker (see next.config.ts)
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_FOR_DOCKER=1

RUN corepack enable pnpm && pnpm run build

# Production image: minimal, non-root, with healthcheck
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user (security best practice)
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Writable dir for Next.js cache (owned by nextjs)
RUN mkdir .next && chown nextjs:nodejs .next

# Standalone output: only traced deps + app (smaller image)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck using Node (Alpine runner has no wget/curl)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]


