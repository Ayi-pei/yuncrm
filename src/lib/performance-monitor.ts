/**
 * 性能监控数据验证和分析工具
 */

import { logger } from "./logger";
import { AppConfig } from "./config";

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: string;
  context?: Record<string, any>;
}

export interface PerformanceReport {
  totalOperations: number;
  averageDuration: number;
  slowOperations: PerformanceMetric[];
  fastestOperation: PerformanceMetric | null;
  slowestOperation: PerformanceMetric | null;
  operationCounts: Record<string, number>;
  timeRange: {
    start: string;
    end: string;
  };
}

class PerformanceAnalyzer {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = AppConfig.performance.maxMetrics; // 使用配置中的最大指标数量
  private slowThreshold = AppConfig.polling.sessionPollInterval; // 使用配置中的轮询间隔作为慢操作阈值

  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // 保持数组大小限制
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // 记录慢操作
    if (metric.duration > this.slowThreshold) {
      logger.warn(`Slow operation detected: ${metric.operation}`, {
        duration: metric.duration,
        threshold: this.slowThreshold,
        context: metric.context,
      });
    }
  }

  generateReport(timeRangeHours: number = 1): PerformanceReport {
    const now = new Date();
    const startTime = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);

    const relevantMetrics = this.metrics.filter(
      (metric) => new Date(metric.timestamp) >= startTime
    );

    if (relevantMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowOperations: [],
        fastestOperation: null,
        slowestOperation: null,
        operationCounts: {},
        timeRange: {
          start: startTime.toISOString(),
          end: now.toISOString(),
        },
      };
    }

    const durations = relevantMetrics.map((m) => m.duration);
    const averageDuration =
      durations.reduce((a, b) => a + b, 0) / durations.length;

    const sortedMetrics = [...relevantMetrics].sort(
      (a, b) => a.duration - b.duration
    );
    const fastestOperation = sortedMetrics[0];
    const slowestOperation = sortedMetrics[sortedMetrics.length - 1];

    const slowOperations = relevantMetrics.filter(
      (m) => m.duration > this.slowThreshold
    );

    const operationCounts: Record<string, number> = {};
    relevantMetrics.forEach((metric) => {
      operationCounts[metric.operation] =
        (operationCounts[metric.operation] || 0) + 1;
    });

    return {
      totalOperations: relevantMetrics.length,
      averageDuration: Math.round(averageDuration * 100) / 100,
      slowOperations,
      fastestOperation,
      slowestOperation,
      operationCounts,
      timeRange: {
        start: startTime.toISOString(),
        end: now.toISOString(),
      },
    };
  }

  getTopSlowOperations(limit: number = 10): PerformanceMetric[] {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getOperationStats(operationName: string) {
    const operationMetrics = this.metrics.filter(
      (m) => m.operation === operationName
    );

    if (operationMetrics.length === 0) {
      return null;
    }

    const durations = operationMetrics.map((m) => m.duration);
    const total = durations.reduce((a, b) => a + b, 0);
    const average = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      operationName,
      count: operationMetrics.length,
      averageDuration: Math.round(average * 100) / 100,
      minDuration: min,
      maxDuration: max,
      totalDuration: total,
    };
  }

  clearMetrics() {
    this.metrics = [];
    logger.info("Performance metrics cleared");
  }

  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // 实时性能监控
  startRealTimeMonitoring(
    intervalMs: number = AppConfig.polling.keyCheckInterval
  ) {
    setInterval(() => {
      const report = this.generateReport(0.5); // 最近30分钟

      if (report.totalOperations > 0) {
        logger.info("Performance Report", {
          totalOperations: report.totalOperations,
          averageDuration: report.averageDuration,
          slowOperationsCount: report.slowOperations.length,
          topOperations: Object.entries(report.operationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5),
        });
      }
    }, intervalMs);
  }
}

// 单例实例
export const performanceAnalyzer = new PerformanceAnalyzer();

// 集成到现有的性能监控Hook
const originalUsePerformanceMonitor =
  require("./performance").usePerformanceMonitor;

// 包装原有的Hook以收集数据
export function useEnhancedPerformanceMonitor(operationName: string) {
  const monitor = originalUsePerformanceMonitor(operationName);

  const enhancedEnd = (context?: Record<string, any>) => {
    const duration = monitor.end();

    // 记录到分析器
    performanceAnalyzer.addMetric({
      operation: operationName,
      duration,
      timestamp: new Date().toISOString(),
      context,
    });

    return duration;
  };

  return {
    start: monitor.start,
    end: enhancedEnd,
  };
}
