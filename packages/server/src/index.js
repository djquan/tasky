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

// Initialize DocumentManager with HTTP URL
// The SDK accepts http:// URLs and handles the connection internally
const manager = new DocumentManager(YSWEET_URL);

console.log('[Token Server] Initializing with Y-Sweet URL:', YSWEET_URL);

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
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

      // clientToken.url contains: ws://y-sweet:8091/d/tasky-main/ws
      // Extract just the path portion (everything after the hostname)
      const urlMatch = clientToken.url.match(/^ws:\/\/[^/]+(.*)$/);
      const path = urlMatch ? urlMatch[1] : `/d/${clientToken.docId}/ws`;

      // Return minimal data - client will construct full URL using same host as this request
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        docId: clientToken.docId,
        path: path, // e.g., /d/tasky-main/ws
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
  console.log(`Client constructs WebSocket URL from token endpoint host`);
});

