#!/usr/bin/env node

/**
 * WebSocket设置验证脚本
 * 自动检查所有组件是否正确配置
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证WebSocket设置...\n');

const checks = [
  {
    name: 'WebSocket服务器文件',
    check: () => fs.existsSync('src/server/websocket-server.ts'),
    fix: '确保 src/server/websocket-server.ts 文件存在'
  },
  {
    name: 'React Hook文件',
    check: () => fs.existsSync('src/hooks/use-websocket.ts'),
    fix: '确保 src/hooks/use-websocket.ts 文件存在'
  },
  {
    name: 'WebSocket库文件',
    check: () => fs.existsSync('src/lib/websocket.ts'),
    fix: '确保 src/lib/websocket.ts 文件存在'
  },
  {
    name: 'package.json脚本',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts && pkg.scripts['dev:full'] && pkg.scripts['dev:ws'];
    },
    fix: '运行脚本配置缺失，请检查 package.json'
  },
  {
    name: '启动脚本',
    check: () => fs.existsSync('scripts/start-simple.js'),
    fix: '确保 scripts/start-simple.js 文件存在'
  },
  {
    name: '测试组件',
    check: () => fs.existsSync('src/components/test/WebSocketTest.tsx'),
    fix: '确保 src/components/test/WebSocketTest.tsx 文件存在'
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  
  if (!passed) {
    console.log(`   💡 ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 所有检查通过！WebSocket设置完成！');
  console.log('\n📋 启动命令:');
  console.log('   npm run dev:full    # 一键启动完整环境');
  console.log('   npm run dev:ws      # 仅启动WebSocket服务器');
  console.log('\n🔧 测试命令:');
  console.log('   访问 http://localhost:3001');
  console.log('   按 Ctrl+Shift+P 打开性能监控面板');
} else {
  console.log('❌ 设置不完整，请修复上述问题后重新验证');
  process.exit(1);
}

console.log('\n📚 详细文档: README.md');