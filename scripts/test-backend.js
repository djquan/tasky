
import { WebSocket } from 'ws';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Polyfill WebSocket for y-websocket
global.WebSocket = WebSocket;

const BASE_URL = process.env.SYNC_URL || 'http://localhost:8080';

console.log(`Testing backend at ${BASE_URL}...`);

async function run() {
  try {
    // 1. Fetch token
    console.log('1. Fetching token...');
    const tokenUrl = `${BASE_URL}/token`;
    const res = await fetch(tokenUrl);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch token: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('   Token received:', JSON.stringify(data, null, 2));
    
    // 2. Rewrite URL (Simulation of frontend logic)
    console.log('2. Rewriting URL...');
    
    // Handle both old and new response formats
    let internalUrl = data.token;
    
    if (!internalUrl && data.url) {
       console.log('   "token" field missing, using "url" field (old format?)');
       internalUrl = data.url;
    }
    
    if (!internalUrl) {
       throw new Error('No token URL found in response');
    }
    
    const base = new URL(BASE_URL);
    
    let internalPath = '';
    try {
      const internalObj = new URL(internalUrl);
      internalPath = internalObj.pathname + internalObj.search;
    } catch {
      console.warn('   Could not parse internal URL, using as is');
      internalPath = internalUrl; // Fallback
    }
    
    const wsProtocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${base.host}${internalPath}`;
    console.log(`   Rewritten URL: ${wsUrl}`);
    
    // 3. Connect to WebSocket
    console.log('3. Connecting to WebSocket...');
    const doc = new Y.Doc();
    
    const provider = new WebsocketProvider(wsUrl, data.docId, doc, {
      connect: true
    });
    
    const waitForConnection = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
      
      provider.on('status', (event) => {
        console.log(`   Connection status: ${event.status}`);
        if (event.status === 'connected') {
          clearTimeout(timeout);
          resolve();
        }
      });
      
      provider.on('connection-error', (event) => {
         console.error('   Connection error event:', event);
      });
      
      provider.on('connection-close', (event) => {
         console.error('   Connection close event:', event);
      });
    });
    
    await waitForConnection;
    console.log('   Connected successfully!');
    
    // 4. Test basic operation
    console.log('4. Testing document update...');
    const map = doc.getMap('test-map');
    map.set('test-key', 'test-value-' + Date.now());
    
    // Wait a bit for sync
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('   Update sent.');
    
    provider.destroy();
    console.log('Done. Backend seems operational.');
    process.exit(0);
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

run();
