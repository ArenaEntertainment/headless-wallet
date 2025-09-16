#!/usr/bin/env node

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple test HTML page that tests can use
const testHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Headless Wallet Test Page</title>
</head>
<body>
    <h1>Headless Wallet Test Page</h1>
    <p>This is a minimal test page for Playwright tests.</p>

    <div id="test-area">
        <button id="connect-btn">Connect Wallet</button>
        <div id="status">Not connected</div>
    </div>

    <script>
        // Basic test functionality
        window.testData = {
            connected: false,
            accounts: []
        };

        // Simple connection test
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                if (window.ethereum) {
                    console.log('EVM wallet detected');
                }
                if (window.phantom?.solana) {
                    console.log('Solana wallet detected');
                }
            }, 100);
        }
    </script>
</body>
</html>`;

// Define test servers needed
const servers = [
    // Note: Port 5174 is used by reown-appkit demo (actual vite server)
    { port: 5175, name: 'Secondary Test Server' },
    { port: 5176, name: 'AppKit Test Server' },
    { port: 5178, name: 'Chain Selection Test Server' },
    { port: 8080, name: 'Security Test Server' },
    { port: 3004, name: 'Wallet Reinstall Test Server' }
];

// Start servers
function startServer(port, name) {
    const server = http.createServer((req, res) => {
        // Set CORS headers for all requests
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        if (req.url === '/' || req.url === '/index.html') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(testHTML);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });

    server.listen(port, '127.0.0.1', () => {
        console.log(`✅ ${name} running on http://localhost:${port}`);
    });

    return server;
}

console.log('🚀 Starting test servers for Playwright tests...\n');

// Start all servers
const runningServers = [];
for (const { port, name } of servers) {
    try {
        const server = startServer(port, name);
        runningServers.push(server);
    } catch (error) {
        console.error(`❌ Failed to start ${name} on port ${port}:`, error.message);
    }
}

console.log('\n🎉 All test servers are running!');
console.log('💡 Press Ctrl+C to stop all servers\n');

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping all test servers...');
    runningServers.forEach(server => server.close());
    process.exit(0);
});

process.on('SIGTERM', () => {
    runningServers.forEach(server => server.close());
    process.exit(0);
});