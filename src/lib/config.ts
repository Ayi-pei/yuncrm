/**
 * 应用配置管理
 * 集中管理所有硬编码的配置项
 */

export const AppConfig = {
  // 密钥管理配置
  keyManagement: {
    morningCutoffHour: 12, // 上午/下午分界点
    cleanupIntervalMs: 60 * 1000, // 清理间隔（毫秒）
    maxKeyLifetimeHours: 24, // 密钥最大生命周期
  },

  // 轮询配置
  polling: {
    chatUpdateInterval: 1500, // 聊天更新间隔
    sessionPollInterval: 2000, // 会话轮询间隔
    keyCheckInterval: 60 * 1000, // 密钥检查间隔
    maxRetries: 3, // 最大重试次数
  },

  // UI 配置
  ui: {
    toastDuration: 3000, // Toast 显示时长
    loadingDelayMs: 500, // 加载延迟显示
    animationDuration: 200, // 动画持续时间
  },

  // 功能开关
  features: {
    piiRedaction: true, // PII 脱敏功能
    fileUpload: true, // 文件上传功能
    realTimeUpdates: true, // 实时更新
    offlineSupport: false, // 离线支持（待实现）
  },

  // API 配置
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
    timeout: 10000, // 请求超时时间
    retryDelay: 1000, // 重试延迟
  },

  // 安全配置
  security: {
    maxMessageLength: 2000, // 最大消息长度
    maxFileSize: 10 * 1024 * 1024, // 最大文件大小 (10MB)
    allowedFileTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ],
  },

  // 性能监控配置
  performance: {
    maxMetrics: 1000, // 最大性能指标数量
  },

  // WebSocket 配置
  websocket: {
    reconnectInterval: 3000, // 重连间隔（毫秒）
    maxReconnectAttempts: 5, // 最大重连尝试次数
    heartbeatInterval: 30000, // 心跳间隔（毫秒）
  },
} as const;

export type ConfigType = typeof AppConfig;
