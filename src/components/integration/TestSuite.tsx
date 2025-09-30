/**
 * 集成测试套件
 * 验证所有优化功能是否正常工作
 */

"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  RotateCcw,
} from "lucide-react";
import { ErrorHandler, ErrorCode } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { AppConfig } from "@/lib/config";
import { wsManager } from "@/lib/websocket";
import { memoryManager } from "@/lib/memory-manager";
import { usePerformanceMonitor } from "@/lib/performance";

interface TestResult {
  name: string;
  status: "pending" | "running" | "passed" | "failed";
  message?: string;
  duration?: number;
}

export function TestSuite() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "错误处理系统", status: "pending" },
    { name: "配置管理", status: "pending" },
    { name: "性能监控", status: "pending" },
    { name: "WebSocket 连接", status: "pending" },
    { name: "内存管理", status: "pending" },
    { name: "日志系统", status: "pending" },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const { start: startTimer, end: endTimer } =
    usePerformanceMonitor("test-suite");

  const updateTestStatus = (
    name: string,
    status: TestResult["status"],
    message?: string,
    duration?: number
  ) => {
    setTests((prev) =>
      prev.map((test) =>
        test.name === name ? { ...test, status, message, duration } : test
      )
    );
  };

  // 测试错误处理系统
  const testErrorHandling = async () => {
    updateTestStatus("错误处理系统", "running");

    try {
      const start = performance.now();

      // 测试基本错误处理
      const testError = ErrorHandler.createError(
        ErrorCode.VALIDATION_ERROR,
        "测试错误消息"
      );

      // 验证错误对象结构
      if (!testError.code || !testError.message) {
        throw new Error("错误对象结构不正确");
      }

      // 测试错误处理（应该不抛出异常）
      ErrorHandler.handle(testError, "TestSuite.testErrorHandling");

      const duration = performance.now() - start;
      updateTestStatus(
        "错误处理系统",
        "passed",
        "所有错误处理功能正常",
        duration
      );
    } catch (error) {
      updateTestStatus("错误处理系统", "failed", `测试失败: ${error}`);
    }
  };

  // 测试配置管理
  const testConfigManagement = async () => {
    updateTestStatus("配置管理", "running");

    try {
      const start = performance.now();

      // 验证配置对象存在
      if (!AppConfig) {
        throw new Error("AppConfig 未定义");
      }

      // 验证关键配置项
      const requiredConfigs = [
        "polling.chatUpdateInterval",
        "security.maxMessageLength",
        "ui.loadingDelayMs",
      ];

      for (const configPath of requiredConfigs) {
        const keys = configPath.split(".");
        let value = AppConfig;

        for (const key of keys) {
          value = (value as any)[key];
          if (value === undefined) {
            throw new Error(`配置项 ${configPath} 未定义`);
          }
        }
      }

      const duration = performance.now() - start;
      updateTestStatus("配置管理", "passed", "所有配置项正常", duration);
    } catch (error) {
      updateTestStatus("配置管理", "failed", `测试失败: ${error}`);
    }
  };

  // 测试性能监控
  const testPerformanceMonitoring = async () => {
    updateTestStatus("性能监控", "running");

    try {
      const start = performance.now();

      // 测试性能监控器
      const testMonitor = usePerformanceMonitor("test-operation");
      testMonitor.start();

      // 模拟一些操作
      await new Promise((resolve) => setTimeout(resolve, 50));

      const measuredDuration = testMonitor.end();

      if (measuredDuration < 40 || measuredDuration > 100) {
        throw new Error(`性能测量不准确: ${measuredDuration}ms`);
      }

      const duration = performance.now() - start;
      updateTestStatus(
        "性能监控",
        "passed",
        `测量精度正常 (${measuredDuration}ms)`,
        duration
      );
    } catch (error) {
      updateTestStatus("性能监控", "failed", `测试失败: ${error}`);
    }
  };

  // 测试 WebSocket 连接
  const testWebSocket = async () => {
    updateTestStatus("WebSocket 连接", "running");

    try {
      const start = performance.now();

      // 获取连接状态
      const connectionState = wsManager.getConnectionState();
      const stats = wsManager.getStats();

      // 验证 WebSocket 管理器功能
      if (!connectionState) {
        throw new Error("WebSocket 管理器未初始化");
      }

      // 验证统计信息结构
      if (!stats || typeof stats.connected !== "boolean") {
        throw new Error("WebSocket 统计信息格式错误");
      }

      const duration = performance.now() - start;
      const message = stats.connected
        ? `已连接 (${connectionState})`
        : `未连接 (${connectionState})`;

      updateTestStatus("WebSocket 连接", "passed", message, duration);
    } catch (error) {
      updateTestStatus("WebSocket 连接", "failed", `测试失败: ${error}`);
    }
  };

  // 测试内存管理
  const testMemoryManagement = async () => {
    updateTestStatus("内存管理", "running");

    try {
      const start = performance.now();

      // 获取内存管理统计
      const stats = memoryManager.getStats();

      // 验证统计信息
      if (
        typeof stats.activeTimers !== "number" ||
        typeof stats.registeredCleanupTasks !== "number"
      ) {
        throw new Error("内存管理统计信息格式错误");
      }

      // 测试定时器注册和清理
      const testTimerId = "test-timer-" + Date.now();
      memoryManager.setInterval(testTimerId, () => {}, 1000);

      const statsAfterRegister = memoryManager.getStats();
      if (statsAfterRegister.activeTimers <= stats.activeTimers) {
        throw new Error("定时器注册失败");
      }

      memoryManager.clearTimer(testTimerId);

      const duration = performance.now() - start;
      updateTestStatus(
        "内存管理",
        "passed",
        `定时器: ${stats.activeTimers}, 清理任务: ${stats.registeredCleanupTasks}`,
        duration
      );
    } catch (error) {
      updateTestStatus("内存管理", "failed", `测试失败: ${error}`);
    }
  };

  // 测试日志系统
  const testLoggingSystem = async () => {
    updateTestStatus("日志系统", "running");

    try {
      const start = performance.now();

      // 测试各种日志级别
      logger.debug("测试调试日志");
      logger.info("测试信息日志");
      logger.warn("测试警告日志");

      // 测试性能日志
      logger.logPerformance("test-operation", 100);

      // 测试用户行为日志
      logger.logUserAction("test_action", "test-user", { testData: true });

      const duration = performance.now() - start;
      updateTestStatus("日志系统", "passed", "所有日志功能正常", duration);
    } catch (error) {
      updateTestStatus("日志系统", "failed", `测试失败: ${error}`);
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    setIsRunning(true);
    startTimer();

    try {
      // 重置所有测试状态
      setTests((prev) =>
        prev.map((test) => ({
          ...test,
          status: "pending",
          message: undefined,
          duration: undefined,
        }))
      );

      // 按顺序运行测试
      await testErrorHandling();
      await testConfigManagement();
      await testPerformanceMonitoring();
      await testWebSocket();
      await testMemoryManagement();
      await testLoggingSystem();

      const totalDuration = endTimer();
      logger.info("测试套件完成", { totalDuration });
    } catch (error) {
      ErrorHandler.handle(error, "TestSuite.runAllTests");
    } finally {
      setIsRunning(false);
    }
  };

  // 重置测试
  const resetTests = () => {
    setTests((prev) =>
      prev.map((test) => ({
        ...test,
        status: "pending",
        message: undefined,
        duration: undefined,
      }))
    );
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return (
          <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />
        );
      default:
        return (
          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
        );
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "passed":
        return (
          <Badge variant="default" className="bg-green-500">
            通过
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">失败</Badge>;
      case "running":
        return <Badge variant="secondary">运行中</Badge>;
      default:
        return <Badge variant="outline">等待</Badge>;
    }
  };

  const passedTests = tests.filter((t) => t.status === "passed").length;
  const failedTests = tests.filter((t) => t.status === "failed").length;
  const totalTests = tests.length;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          集成测试套件
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetTests}
              disabled={isRunning}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>
            <Button onClick={runAllTests} disabled={isRunning} size="sm">
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? "运行中..." : "开始测试"}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>验证所有优化功能是否正常工作</CardDescription>

        {(passedTests > 0 || failedTests > 0) && (
          <div className="flex gap-4 pt-2">
            <span className="text-sm text-green-600">
              通过: {passedTests}/{totalTests}
            </span>
            {failedTests > 0 && (
              <span className="text-sm text-red-600">
                失败: {failedTests}/{totalTests}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={test.name}>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    {test.message && (
                      <div className="text-sm text-muted-foreground">
                        {test.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {test.duration && (
                    <span className="text-xs text-muted-foreground">
                      {test.duration.toFixed(1)}ms
                    </span>
                  )}
                  {getStatusBadge(test.status)}
                </div>
              </div>
              {index < tests.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
