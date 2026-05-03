#!/usr/bin/env node
const { spawn } = require('child_process');
const args = ['vitest', 'run', '--reporter', 'json'];
console.log('Spawning: npx', args.join(' '));
const proc = spawn('npx', args, { cwd: process.cwd(), shell: true });

proc.stdout.on('data', (chunk) => {
  process.stdout.write(chunk.toString());
});

proc.stderr.on('data', (chunk) => {
  process.stderr.write(chunk.toString());
});

proc.on('close', (code) => {
  console.log('\nchild process exited with code', code);
  process.exit(code);
});
