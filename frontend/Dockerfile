FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
COPY astro.config.mjs ./
RUN bun add astro

COPY src ./src

EXPOSE 4321

CMD ["bun", "run", "astro", "dev", "--host"]
