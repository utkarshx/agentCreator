#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(prefix, message, color = colors.reset) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

// Start frontend
const frontend = spawn('npm', ['run', 'dev', '--filter=@agent-creator/frontend'], {
  stdio: 'pipe',
  shell: true
});

// Start backend
const backend = spawn('npm', ['run', 'dev', '--filter=@agent-creator/backend'], {
  stdio: 'pipe',
  shell: true
});

frontend.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Local:') || output.includes('ready')) {
    log('FRONTEND', output.trim(), colors.green);
  }
});

frontend.stderr.on('data', (data) => {
  log('FRONTEND ERROR', data.toString().trim(), colors.red);
});

backend.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Server running') || output.includes('listening')) {
    log('BACKEND', output.trim(), colors.blue);
  }
});

backend.stderr.on('data', (data) => {
  log('BACKEND ERROR', data.toString().trim(), colors.red);
});

// Handle process termination
process.on('SIGINT', () => {
  log('SHUTDOWN', 'Terminating processes...', colors.yellow);
  frontend.kill('SIGINT');
  backend.kill('SIGINT');
  process.exit(0);
});

log('STARTUP', 'Starting Agent Creator development servers...', colors.cyan);
log('INFO', 'Frontend will be available at http://localhost:3000', colors.cyan);
log('INFO', 'Backend will be available at http://localhost:3001', colors.cyan);
log('INFO', 'Press Ctrl+C to stop all servers', colors.cyan);