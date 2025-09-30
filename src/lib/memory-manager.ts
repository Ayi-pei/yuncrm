/**
 * 内存管理服务
 * 统一管理定时器和内存清理
 */

import { logger } from './logger';
import { AppConfig } from './config';

export class MemoryManager {
  private static instance: MemoryManager;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private cleanupTasks: Map<string, () => void> = new Map();
  private isCleanupRunning = false;

  private constructor() {
    this.startPeriodicCleanup();
    this.setupBeforeUnloadHandler();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // 注册定时器
  setInterval(
    id: string, 
    callback: () => void, 
    interval: number,
    immediate: boolean = false
  ): void {
    this.clearTimer(id);
    
    if (immediate) {
      callback();
    }
    
    const timer = setInterval(() => {
      try {
        callback();
      } catch (error) {
        logger.error(`Timer ${id} callback failed`, error as Error);
      }
    }, interval);
    
    this.timers.set(id, timer);
    logger.debug(`Timer ${id} registered`, { interval, immediate });
  }

  // 注册超时器
  setTimeout(id: string, callback: () => void, delay: number): void {
    this.clearTimer(id);
    
    const timer = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        logger.error(`Timeout ${id} callback failed`, error as Error);
      } finally {
        this.timers.delete(id);
      }
    }, delay);
    
    this.timers.set(id, timer);
    logger.debug(`Timeout ${id} registered`, { delay });
  }

  // 清除定时器
  clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      clearTimeout(timer);
      this.timers.delete(id);
      logger.debug(`Timer ${id} cleared`);
    }
  }

  // 注册清理任务
  registerCleanupTask(id: string, task: () => void): void {
    this.cleanupTasks.set(id, task);
    logger.debug(`Cleanup task ${id} registered`);
  }

  // 移除清理任务
  unregisterCleanupTask(id: string): void {
    this.cleanupTasks.delete(id);
    logger.debug(`Cleanup task ${id} unregistered`);
  }

  // 执行手动清理
  executeCleanup(): void {
    if (this.isCleanupRunning) {
      logger.warn('Cleanup already running, skipping');
      return;
    }

    this.isCleanupRunning = true;
    logger.info('Starting manual cleanup');

    let tasksExecuted = 0;
    let tasksFailed = 0;

    for (const [id, task] of this.cleanupTasks) {
      try {
        task();
        tasksExecuted++;
        logger.debug(`Cleanup task ${id} executed successfully`);
      } catch (error) {
        tasksFailed++;
        logger.error(`Cleanup task ${id} failed`, error as Error);
      }
    }

    this.isCleanupRunning = false;
    logger.info('Manual cleanup completed', { tasksExecuted, tasksFailed });
  }

  // 启动周期性清理
  private startPeriodicCleanup(): void {
    this.setInterval(
      'periodic-cleanup',
      () => this.executeCleanup(),
      AppConfig.keyManagement.cleanupIntervalMs
    );
  }

  // 设置页面卸载时的清理
  private setupBeforeUnloadHandler(): void {
    if (typeof window !== 'undefined') {
      const cleanup = () => {
        logger.info('Page unloading, performing cleanup');
        this.destroy();
      };

      window.addEventListener('beforeunload', cleanup);
      window.addEventListener('unload', cleanup);
    }
  }

  // 销毁管理器
  destroy(): void {
    logger.info('Destroying MemoryManager');

    // 清除所有定时器
    for (const [id] of this.timers) {
      this.clearTimer(id);
    }

    // 执行最后一次清理
    this.executeCleanup();

    // 清空任务列表
    this.cleanupTasks.clear();

    logger.info('MemoryManager destroyed');
  }

  // 获取统计信息
  getStats() {
    return {
      activeTimers: this.timers.size,
      registeredCleanupTasks: this.cleanupTasks.size,
      isCleanupRunning: this.isCleanupRunning,
    };
  }
}

// 单例实例
export const memoryManager = MemoryManager.getInstance();

// Hook for React components
import { useEffect } from 'react';

export function useMemoryManager() {
  useEffect(() => {
    return () => {
      // 组件卸载时的清理会由 MemoryManager 统一处理
    };
  }, []);

  return memoryManager;
}