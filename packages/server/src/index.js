/**
 * Y-Sweet Token Server
 *
 * Simple HTTP server that generates Y-Sweet client tokens for document access.
 * No authentication required (single-user setup).
 */

import http from 'http';
import { DocumentManager } from '@y-sweet/sdk';

const PORT = process.env.PORT || 8092;
const YSWEET_URL = process.env.YSWEET_URL || 'http://localhost:8091';
const DOCUMENT_ID = process.env.DOCUMENT_ID || 'tasky-main';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:8090', 'http://localhost:4173', 'http://localhost:8080'];

// Initialize DocumentManager with HTTP URL
// The SDK accepts http:// URLs and handles the connection internally
const manager = new DocumentManager(YSWEET_URL);

console.log('[Token Server] Initializing with Y-Sweet URL:', YSWEET_URL);

const server = http.createServer(async (req, res) => {
  // Enable CORS for allowed origins only
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/token') {
    try {
      // Generate token for the document (no auth required for single user)
      const clientToken = await manager.getOrCreateDocAndToken(DOCUMENT_ID);

      // clientToken is an object with: { url, baseUrl, docId, authorization }
      // We return the internal URL directly; the frontend is responsible for
      // rewriting it to the public URL if needed (e.g. when behind Nginx).
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        token: clientToken.url, // Internal WebSocket URL
        docId: clientToken.docId
      }));
    } catch (error) {
      console.error('Error generating token:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to generate token' }));
    }
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Y-Sweet token server running on http://localhost:${PORT}`);
  console.log(`Document ID: ${DOCUMENT_ID}`);
  console.log(`Y-Sweet internal URL: ${YSWEET_URL}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
