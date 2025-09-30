/**
 * 统一日志管理系统
 * 替换散落在代码中的 console.log/error
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN;

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error ? { ...context, error: error.message, stack: error.stack } : context;
      console.error(this.formatMessage('ERROR', message, errorContext));
    }
  }

  // 业务日志方法
  logUserAction(action: string, userId: string, details?: Record<string, any>): void {
    this.info(`User action: ${action}`, { userId, ...details });
  }

  logApiCall(method: string, url: string, duration: number, success: boolean): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `API ${method} ${url} ${success ? 'succeeded' : 'failed'} in ${duration}ms`;
    
    if (level === LogLevel.INFO) {
      this.info(message);
    } else {
      this.error(message);
    }
  }

  logPerformance(operation: string, duration: number, threshold: number = 1000): void {
    if (duration > threshold) {
      this.warn(`Slow operation detected: ${operation}`, { duration, threshold });
    } else {
      this.debug(`Performance: ${operation}`, { duration });
    }
  }
}

export const logger = new Logger();