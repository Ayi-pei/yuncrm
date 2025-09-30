/**
 * 性能调试面板
 * 用于实时查看性能监控数据
 */

"use client";

import React, { useState, useEffect } from "react";
import { performanceAnalyzer } from "@/lib/performance-monitor";
import { wsManager } from "@/lib/websocket";
import { memoryManager } from "@/lib/memory-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  Download,
  Trash2,
  Activity,
  Wifi,
  HardDrive,
} from "lucide-react";

export function PerformanceDebugPanel() {
  const [report, setReport] = useState(performanceAnalyzer.generateReport());
  const [wsStats, setWsStats] = useState(wsManager.getStats());
  const [memoryStats, setMemoryStats] = useState(memoryManager.getStats());
  const [isVisible, setIsVisible] = useState(false);

  // 刷新数据
  const refreshData = () => {
    setReport(performanceAnalyzer.generateReport());
    setWsStats(wsManager.getStats());
    setMemoryStats(memoryManager.getStats());
  };

  // 自动刷新
  useEffect(() => {
    const interval = setInterval(refreshData, 5000); // 每5秒刷新
    return () => clearInterval(interval);
  }, []);

  // 键盘快捷键切换显示
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isVisible]);

  // 导出性能数据
  const exportData = () => {
    const data = {
      performanceReport: report,
      websocketStats: wsStats,
      memoryStats: memoryStats,
      exportTime: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-data-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 清除性能数据
  const clearData = () => {
    performanceAnalyzer.clearMetrics();
    refreshData();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Activity className="h-4 w-4 mr-2" />
          性能监控
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[600px] z-50 bg-background border rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">性能监控面板</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={exportData}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={clearData}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            ×
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-4">
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance">性能</TabsTrigger>
              <TabsTrigger value="websocket">WebSocket</TabsTrigger>
              <TabsTrigger value="memory">内存</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">性能概览</CardTitle>
                  <CardDescription>最近1小时的操作统计</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>总操作数:</span>
                    <Badge variant="secondary">{report.totalOperations}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>平均耗时:</span>
                    <Badge
                      variant={
                        report.averageDuration > 500
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {report.averageDuration}ms
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>慢操作:</span>
                    <Badge
                      variant={
                        report.slowOperations.length > 0
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {report.slowOperations.length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">操作统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {Object.entries(report.operationCounts)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([operation, count]) => (
                        <div
                          key={operation}
                          className="flex justify-between text-sm"
                        >
                          <span className="truncate">{operation}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {report.slowOperations.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-destructive">
                      慢操作详情
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.slowOperations.slice(0, 3).map((op, index) => (
                        <div key={index} className="text-xs">
                          <div className="font-medium">{op.operation}</div>
                          <div className="text-muted-foreground">
                            {op.duration}ms -{" "}
                            {new Date(op.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="websocket" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    WebSocket 状态
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>连接状态:</span>
                    <Badge
                      variant={wsStats.connected ? "default" : "secondary"}
                    >
                      {wsStats.connectionState}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>重连次数:</span>
                    <Badge variant="secondary">
                      {wsStats.reconnectAttempts}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>用户角色:</span>
                    <Badge variant="outline">{wsStats.userRole || "N/A"}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">事件处理器</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {wsStats.registeredHandlers.map((handler, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="truncate">{handler.type}</span>
                        <span>{handler.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="memory" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    内存管理
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>活跃定时器:</span>
                    <Badge variant="secondary">
                      {memoryStats.activeTimers}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>清理任务:</span>
                    <Badge variant="secondary">
                      {memoryStats.registeredCleanupTasks}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>清理运行中:</span>
                    <Badge
                      variant={
                        memoryStats.isCleanupRunning
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {memoryStats.isCleanupRunning ? "是" : "否"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <div className="p-2 border-t text-xs text-muted-foreground text-center">
        按 Ctrl+Shift+P 切换显示
      </div>
    </div>
  );
}
