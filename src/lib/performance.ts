/**
 * 性能优化工具
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { logger } from './logger';

// 防抖 Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 节流 Hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// 智能轮询 Hook - 页面不可见时停止轮询
export function useSmartPolling(
  callback: () => void | Promise<void>,
  interval: number,
  enabled: boolean = true
) {
  const intervalRef = useRef<NodeJS.Timeout>();
  const isActiveRef = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      
      if (document.hidden) {
        logger.debug('Page hidden, stopping polling');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
      } else {
        logger.debug('Page visible, resuming polling');
        startPolling();
      }
    };

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      if (enabled && isActiveRef.current) {
        intervalRef.current = setInterval(() => {
          if (isActiveRef.current) {
            callback();
          }
        }, interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startPolling();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callback, interval, enabled]);
}

// 内存管理 Hook
export function useCleanup(cleanup: () => void) {
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
}

// 性能监控 Hook
export function usePerformanceMonitor(operationName: string) {
  const startTime = useRef<number>();

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      logger.logPerformance(operationName, duration);
      startTime.current = undefined;
      return duration;
    }
    return 0;
  }, [operationName]);

  return { start, end };
}

// 虚拟列表优化
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // +2 for buffer
    const totalHeight = items.length * itemHeight;
    
    return {
      totalHeight,
      visibleCount,
      getVisibleItems: (scrollTop: number) => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount, items.length);
        
        return {
          startIndex,
          endIndex,
          items: items.slice(startIndex, endIndex),
          offsetY: startIndex * itemHeight,
        };
      },
    };
  }, [items, itemHeight, containerHeight]);
}

// React 组件性能优化工具
export const PerformanceUtils = {
  // 浅比较，用于 React.memo
  shallowEqual<T extends Record<string, any>>(prev: T, next: T): boolean {
    const keys1 = Object.keys(prev);
    const keys2 = Object.keys(next);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (prev[key] !== next[key]) {
        return false;
      }
    }

    return true;
  },

  // 创建优化的组件
  memo<P extends Record<string, any>>(
    Component: React.ComponentType<P>,
    propsAreEqual?: (prev: P, next: P) => boolean
  ) {
    return React.memo(Component, propsAreEqual || this.shallowEqual);
  },
};