FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
COPY astro.config.mjs ./
RUN bun add astro @astrojs/node

COPY src ./src

RUN bun run astro build

EXPOSE 4321

CMD bun run node ./dist/server/entry.mjs
