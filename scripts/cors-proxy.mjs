import http from 'node:http';

const listenPort = Number(process.env.KOKORO_PROXY_PORT || 8881);
const targetOrigin = process.env.KOKORO_TARGET_ORIGIN || 'http://localhost:8880';

function writeCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const server = http.createServer(async (req, res) => {
  writeCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  try {
    const targetUrl = new URL(req.url || '/', targetOrigin);
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body: chunks.length ? Buffer.concat(chunks) : undefined,
    });

    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
    });

    if (upstream.body) {
      for await (const chunk of upstream.body) {
        res.write(chunk);
      }
    }
    res.end();
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`Kokoro proxy failed: ${error instanceof Error ? error.message : String(error)}`);
  }
});

server.listen(listenPort, () => {
  console.log(`Kokoro CORS proxy listening on http://localhost:${listenPort}`);
  console.log(`Forwarding requests to ${targetOrigin}`);
});
