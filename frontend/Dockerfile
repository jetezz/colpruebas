FROM oven/bun:1-alpine

WORKDIR /app

COPY public ./public

EXPOSE 4321

CMD ["bun", "-e", "const server = Bun.serve({ port: 4321, fetch: (req) => new Response(Bun.file('public/index.html'), { headers: { 'Content-Type': 'text/html' } }) }); console.log('Server running on port ' + server.port);"]
