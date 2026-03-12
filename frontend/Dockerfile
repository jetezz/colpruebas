FROM oven/bun:1-alpine

WORKDIR /app

RUN mkdir -p public && echo '<!DOCTYPE html><html><body><h1>Test Project</h1></body></html>' > public/index.html

EXPOSE 4321

CMD ["bun", "-e", "const server = Bun.serve({ port: 4321, fetch: (req) => new Response(Bun.file('public/index.html'), { headers: { 'Content-Type': 'text/html' } }) }); console.log('Server running on port ' + server.port);"]