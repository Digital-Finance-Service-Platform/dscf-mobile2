#!/usr/bin/env node
const { spawn } = require('child_process');

// Ensure the Expo CLI doctor check is disabled for this run
const env = Object.assign({}, process.env, { EXPO_NO_DOCTOR: 'true' });

const isWin = process.platform === 'win32';
const cmd = isWin ? 'npx.cmd' : 'npx';
const args = ['expo', 'start', '-c'];

const child = spawn(cmd, args, { stdio: 'inherit', env });

child.on('exit', (code) => process.exit(code));
child.on('error', (err) => {
  console.error('Failed to start Expo:', err);
  process.exit(1);
});
