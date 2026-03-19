import type { APIRoute } from 'astro';

export const ALL: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  const backendUrl = `http://api-test:3000${path}${url.search}`;

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        ...Object.fromEntries(request.headers.entries()),
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error', message: String(error) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
