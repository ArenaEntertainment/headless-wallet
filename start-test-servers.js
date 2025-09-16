#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the servers needed for tests
const servers = [
  {
    name: 'Vanilla Demo',
    port: 3002,
    cwd: path.join(__dirname, 'demos', 'vanilla'),
    command: 'npm',
    args: ['run', 'dev']
  },
  {
    name: 'React Demo',
    port: 3000,
    cwd: path.join(__dirname, 'demos', 'react'),
    command: 'npm',
    args: ['run', 'dev']
  },
  {
    name: 'ReownAppKit Demo',
    port: 5173,
    cwd: path.join(__dirname, 'demos', 'reown-appkit'),
    command: 'npm',
    args: ['run', 'dev']
  },
  {
    name: 'Vue Demo',
    port: 5175,
    cwd: path.join(__dirname, 'demos', 'vue'),
    command: 'npm',
    args: ['run', 'dev']
  }
];

const processes = [];

console.log('🚀 Starting demo servers for testing...\n');

// Function to start a server
function startServer(server) {
  return new Promise((resolve, reject) => {
    console.log(`📡 Starting ${server.name} on port ${server.port}...`);

    const proc = spawn(server.command, server.args, {
      cwd: server.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    proc.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('ready') || output.includes('localhost')) {
        console.log(`✅ ${server.name} ready on port ${server.port}`);
        resolve(proc);
      }
    });

    proc.stderr.on('data', (data) => {
      const output = data.toString();
      console.log(`[${server.name}] ${output.trim()}`);
    });

    proc.on('error', (error) => {
      console.error(`❌ Failed to start ${server.name}:`, error);
      reject(error);
    });

    proc.on('close', (code) => {
      console.log(`🔴 ${server.name} stopped with code ${code}`);
    });

    // Add to processes array for cleanup
    processes.push(proc);

    // Set timeout for server startup
    setTimeout(() => {
      if (!proc.killed) {
        console.log(`⏰ ${server.name} started (assuming ready)`);
        resolve(proc);
      }
    }, 5000);
  });
}

// Start all servers
async function startAllServers() {
  try {
    // Start servers in sequence to avoid port conflicts
    for (const server of servers) {
      await startServer(server);
      // Small delay between starts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 All demo servers are running!');
    console.log('💡 Press Ctrl+C to stop all servers\n');
    console.log('📋 Running servers:');
    servers.forEach(server => {
      console.log(`  - ${server.name}: http://localhost:${server.port}`);
    });
    console.log('\n🧪 You can now run the tests with: npx playwright test\n');

  } catch (error) {
    console.error('❌ Failed to start servers:', error);
    cleanup();
    process.exit(1);
  }
}

// Cleanup function
function cleanup() {
  console.log('\n🛑 Stopping all servers...');
  processes.forEach(proc => {
    if (!proc.killed) {
      proc.kill('SIGTERM');
    }
  });
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the servers
startAllServers();