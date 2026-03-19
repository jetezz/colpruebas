FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
COPY astro.config.mjs ./
RUN bun add astro @astrojs/node

COPY src ./src

EXPOSE 4321

CMD ["bun", "run", "astro", "build", "--host", "&&", "bun", "run", "node", "./dist/server/entry.mjs"]
