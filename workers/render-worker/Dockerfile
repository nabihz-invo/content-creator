# Render worker image (ADR-0008). Build from the repository root:
#   docker build -f workers/render-worker/Dockerfile -t cc-render-worker .
FROM mcr.microsoft.com/playwright:v1.56.1-noble

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg git ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared packages/shared
COPY templates templates
COPY workers/creative-worker workers/creative-worker
COPY workers/render-worker workers/render-worker
RUN pnpm install --frozen-lockfile --filter @cc/render-worker... \
 && npm install -g playwright@1.56.1 \
 && mkdir -p /work && chown pwuser:pwuser /work

ENV NODE_ENV=production \
    NODE_PATH=/usr/lib/node_modules \
    WORK_DIR=/work \
    RENDER_OUTPUT_TYPES=png,carousel

# Non-root; the work directory is the only writable path the worker needs.
USER pwuser
WORKDIR /app/workers/render-worker
CMD ["node", "--experimental-strip-types", "src/main.ts"]
