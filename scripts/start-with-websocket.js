#!/usr/bin/env node

/**
 * 启动脚本：同时启动 Next.js 应用和 WebSocket 服务器
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const isWin = process.platform === 'win32';

console.log('🚀 启动云聚-CRM完整开发环境...\n');

// WebSocket 服务器配置
const wsServerPath = path.join(__dirname, '../src/server/websocket-server.ts');
const wsPort = 8080;

// Next.js 应用配置
const nextPort = 3001;

// 安装WebSocket依赖
console.log('📦 检查WebSocket依赖...');
const installCmd = isWin ? 'npm.cmd' : 'npm';
const installArgs = ['install', 'ws', '@types/ws', 'tsx'];

const installDeps = spawn(installCmd, installArgs, {
  stdio: 'pipe',
  shell: true
});

installDeps.on('close', (code) => {
  if (code === 0) {
    console.log('✅ 依赖安装完成');
    startWebSocketServer();
  } else {
    console.error('❌ 依赖安装失败');
    process.exit(1);
  }
});

function startWebSocketServer() {
  // 启动 WebSocket 服务器
  console.log('📡 启动 WebSocket 服务器...');

  // 使用 exec 替代 spawn 来避免 Windows 上的 spawn EINVAL 错误
  const wsServer = exec('npx tsx ' + wsServerPath, {
    env: {
      ...process.env,
      WS_PORT: wsPort.toString()
    }
  });

  wsServer.stdout.on('data', (data) => {
    console.log(`[WebSocket] ${data.toString().trim()}`);
  });

  wsServer.stderr.on('data', (data) => {
    console.error(`[WebSocket Error] ${data.toString().trim()}`);
  });

  // 等待 WebSocket 服务器启动
  setTimeout(() => {
    console.log('\n💻 启动 Next.js 应用...');

    // 使用 exec 替代 spawn 来避免 Windows 上的 spawn EINVAL 错误
    const nextApp = exec(`npm run dev -- --port ${nextPort}`, {
      env: {
        ...process.env,
        NEXT_PUBLIC_WS_URL: `ws://localhost:${wsPort}`,
        NODE_ENV: 'development'
      }
    });

    nextApp.stdout.on('data', (data) => {
      console.log(`[Next.js] ${data.toString().trim()}`);
    });

    nextApp.stderr.on('data', (data) => {
      console.error(`[Next.js Error] ${data.toString().trim()}`);
    });

    // 处理进程退出
    nextApp.on('close', (code) => {
      console.log(`\n❌ Next.js 应用退出，代码: ${code}`);
      wsServer.kill();
      process.exit(code);
    });

    console.log(`\n✅ 开发环境启动完成！`);
    console.log(`📱 前端应用: http://localhost:${nextPort}`);
    console.log(`🔌 WebSocket: ws://localhost:${wsPort}`);
    console.log(`🔧 性能监控: 按 Ctrl+Shift+P 打开调试面板`);
    console.log(`\n按 Ctrl+C 退出\n`);

  }, 2000);
}

// 处理进程退出
wsServer.on('close', (code) => {
  console.log(`\n❌ WebSocket 服务器退出，代码: ${code}`);
  process.exit(code);
});

// 优雅退出处理
process.on('SIGINT', () => {
  console.log('\n🔄 正在优雅退出...');
  try {
    wsServer.kill('SIGINT');
  } catch (e) {
    // 忽略错误
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 正在优雅退出...');
  try {
    wsServer.kill('SIGTERM');
  } catch (e) {
    // 忽略错误
  }
  process.exit(0);
});