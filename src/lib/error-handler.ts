/**
 * 统一错误处理系统
 */

import { logger } from './logger';
import { toast } from '@/hooks/use-toast';

export enum ErrorCode {
  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // 认证错误
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // 业务错误
  KEY_EXPIRED = 'KEY_EXPIRED',
  KEY_INVALID = 'KEY_INVALID',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  CUSTOMER_BLOCKED = 'CUSTOMER_BLOCKED',
  
  // 系统错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  originalError?: Error;
}

export class ErrorHandler {
  private static userFriendlyMessages: Record<ErrorCode, string> = {
    [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络后重试',
    [ErrorCode.API_ERROR]: '服务器响应异常，请稍后重试',
    [ErrorCode.TIMEOUT_ERROR]: '请求超时，请稍后重试',
    
    [ErrorCode.AUTH_EXPIRED]: '登录已过期，请重新登录',
    [ErrorCode.AUTH_INVALID]: '登录信息无效，请重新登录',
    [ErrorCode.PERMISSION_DENIED]: '没有权限执行此操作',
    
    [ErrorCode.KEY_EXPIRED]: '密钥已过期，请更新密钥',
    [ErrorCode.KEY_INVALID]: '密钥无效或格式错误',
    [ErrorCode.SESSION_NOT_FOUND]: '会话不存在或已结束',
    [ErrorCode.CUSTOMER_BLOCKED]: '该客户已被屏蔽',
    
    [ErrorCode.UNKNOWN_ERROR]: '发生未知错误，请联系技术支持',
    [ErrorCode.VALIDATION_ERROR]: '输入数据格式不正确',
  };

  static createError(code: ErrorCode, message?: string, details?: Record<string, any>, originalError?: Error): AppError {
    return {
      code,
      message: message || this.userFriendlyMessages[code],
      details,
      originalError,
    };
  }

  static handle(error: AppError | Error | unknown, context?: string): void {
    let appError: AppError;

    if (this.isAppError(error)) {
      appError = error;
    } else if (error instanceof Error) {
      appError = this.fromError(error);
    } else {
      appError = this.createError(ErrorCode.UNKNOWN_ERROR, '未知错误');
    }

    // 记录错误日志
    logger.error(
      `Error handled: ${appError.code}`,
      appError.originalError,
      {
        context,
        code: appError.code,
        details: appError.details,
      }
    );

    // 显示用户友好的错误信息
    this.showUserError(appError);
  }

  private static isAppError(error: unknown): error is AppError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  private static fromError(error: Error): AppError {
    // 根据错误信息判断错误类型
    if (error.message.includes('fetch')) {
      return this.createError(ErrorCode.NETWORK_ERROR, undefined, undefined, error);
    }
    
    if (error.message.includes('timeout')) {
      return this.createError(ErrorCode.TIMEOUT_ERROR, undefined, undefined, error);
    }

    return this.createError(ErrorCode.UNKNOWN_ERROR, error.message, undefined, error);
  }

  private static showUserError(error: AppError): void {
    // 某些错误不需要显示给用户
    const silentErrors = [ErrorCode.AUTH_EXPIRED];
    
    if (silentErrors.includes(error.code)) {
      return;
    }

    toast({
      title: '操作失败',
      description: error.message,
      variant: 'destructive',
    });
  }

  // 业务特定的错误处理方法
  static handleAuthError(error: unknown): void {
    const authError = this.createError(ErrorCode.AUTH_EXPIRED);
    this.handle(authError, 'Authentication');
    
    // 重定向到登录页
    window.location.href = '/';
  }

  static handleApiError(response: Response, context?: string): never {
    const error = this.createError(
      ErrorCode.API_ERROR,
      `API请求失败: ${response.status} ${response.statusText}`,
      { status: response.status, url: response.url }
    );
    
    this.handle(error, context);
    throw error;
  }

  static async wrapAsync<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }
}

// 装饰器函数，用于方法级错误处理
export function handleErrors(context?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        ErrorHandler.handle(error, context || `${target.constructor.name}.${propertyName}`);
        throw error;
      }
    };
  };
}