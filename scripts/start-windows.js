#!/usr/bin/env node

/**
 * Windows专用启动脚本：快速启动开发环境
 * 专门针对Windows系统优化，避免spawn EINVAL错误
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 启动云聚-CRM开发环境 (Windows优化版)...\n');

// 安装必要的依赖
console.log('📦 安装必要依赖...');
const installDeps = exec('npm install ws @types/ws tsx', { cwd: process.cwd() });

installDeps.stdout.on('data', (data) => {
    process.stdout.write(data);
});

installDeps.stderr.on('data', (data) => {
    process.stderr.write(data);
});

installDeps.on('close', (code) => {
    if (code !== 0) {
        console.error('❌ 依赖安装失败');
        process.exit(1);
    }

    console.log('✅ 依赖安装完成\n');
    startServices();
});

function startServices() {
    console.log('💻 启动 Next.js 应用 (端口 3001)...');

    // 启动 Next.js 应用
    const nextApp = exec('npm run dev -- --port 3001', {
        env: {
            ...process.env,
            NEXT_PUBLIC_WS_URL: 'ws://localhost:8080',
            NODE_ENV: 'development'
        },
        cwd: process.cwd()
    });

    nextApp.stdout.on('data', (data) => {
        // 只输出包含重要信息的日志
        const log = data.toString();
        if (log.includes('ready') || log.includes('error') || log.includes('warn')) {
            process.stdout.write(log);
        }
    });

    nextApp.stderr.on('data', (data) => {
        process.stderr.write(data);
    });

    // 延迟启动 WebSocket 服务器
    setTimeout(() => {
        console.log('\n📡 启动 WebSocket 服务器 (端口 8080)...');

        // 启动 WebSocket 服务器
        const wsServer = exec('npx tsx ./src/server/websocket-server.ts', {
            env: {
                ...process.env,
                WS_PORT: '8080'
            },
            cwd: process.cwd()
        });

        wsServer.stdout.on('data', (data) => {
            // 只输出包含重要信息的日志
            const log = data.toString();
            if (log.includes('ready') || log.includes('error') || log.includes('warn') || log.includes('started')) {
                process.stdout.write(`[WebSocket] ${log}`);
            }
        });

        wsServer.stderr.on('data', (data) => {
            process.stderr.write(`[WebSocket Error] ${data}`);
        });

        console.log('\n✅ 开发环境启动命令已执行！');
        console.log('📱 前端应用将运行在: http://localhost:3001');
        console.log('🔌 WebSocket 服务器将运行在: ws://localhost:8080');
        console.log('\n按 Ctrl+C 停止所有服务\n');

        // 处理退出信号
        process.on('SIGINT', () => {
            console.log('\n🔄 正在停止所有服务...');
            nextApp.kill();
            wsServer.kill();
            process.exit(0);
        });

    }, 3000);
}