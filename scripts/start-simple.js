#!/usr/bin/env node

/**
 * 简化启动脚本：快速启动开发环境
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const isWin = process.platform === 'win32';

console.log('🚀 启动云聚-CRM开发环境...\n');

// 检查依赖（确保 ws 存在于根目录 node_modules）
console.log('📦 安装必要依赖...');
const installCmd = isWin ? 'npm.cmd' : 'npm';
const installArgs = ['install', 'ws', '@types/ws'];

const deps = spawn(installCmd, installArgs, {
  stdio: 'inherit',
  shell: true
});

deps.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ 依赖安装失败');
    process.exit(1);
  }

  console.log('✅ 依赖安装完成\n');
  startServers();
});

function startServers() {
  // 启动 Next.js (端口 3001)
  console.log('💻 启动 Next.js 应用...');

  // 使用 exec 替代 spawn 来避免 Windows 上的 spawn EINVAL 错误
  const nextApp = exec('npm run dev -- --port 3001', {
    env: {
      ...process.env,
      NEXT_PUBLIC_WS_URL: 'ws://localhost:8080',
      NODE_ENV: 'development'
    }
  });

  nextApp.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  nextApp.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  // 延迟启动 WebSocket 服务器
  setTimeout(() => {
    console.log('\n📡 启动 WebSocket 服务器...');

    // 使用 exec 替代 spawn 来避免 Windows 上的 spawn EINVAL 错误
    const wsServer = exec('npx tsx ./src/server/websocket-server.ts', {
      env: {
        ...process.env,
        WS_PORT: '8080'
      }
    });

    wsServer.stdout.on('data', (data) => {
      process.stdout.write(`[WebSocket] ${data}`);
    });

    wsServer.stderr.on('data', (data) => {
      process.stderr.write(`[WebSocket Error] ${data}`);
    });

    // 处理退出
    process.on('SIGINT', () => {
      console.log('\n🔄 正在退出...');
      nextApp.kill();
      wsServer.kill();
      process.exit(0);
    });

  }, 3000);
}