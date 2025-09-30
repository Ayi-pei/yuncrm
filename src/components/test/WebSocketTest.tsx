/**
 * WebSocket功能测试组件
 * 验证WebSocket连接和消息传递
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket } from '@/hooks/use-websocket';
import { WebSocketEventType } from '@/lib/websocket';
import { logger } from '@/lib/logger';
import { Send, Wifi, WifiOff, RotateCcw } from 'lucide-react';

interface TestMessage {
  id: string;
  text: string;
  timestamp: string;
  type: 'sent' | 'received';
}

export function WebSocketTest() {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const { 
    connect, 
    disconnect, 
    send, 
    isConnected, 
    connectionState,
    subscribe 
  } = useWebSocket({
    autoConnect: false, // 手动控制连接
    events: {
      [WebSocketEventType.MESSAGE_RECEIVED]: (data) => {
        setMessages(prev => [...prev, {
          id: `recv-${Date.now()}`,
          text: `收到: ${JSON.stringify(data)}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'received'
        }]);
        setTestResults(prev => ({ ...prev, messageReceive: true }));
      }
    }
  });

  // 手动连接测试
  const handleConnect = async () => {
    const success = await connect();
    setTestResults(prev => ({ ...prev, connection: success }));
    if (success) {
      logger.info('WebSocket test connection successful');
    }
  };

  // 发送测试消息
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const success = send(WebSocketEventType.MESSAGE_RECEIVED, {
      text: inputText,
      sessionId: 'test-session',
      timestamp: new Date().toISOString()
    });

    if (success) {
      setMessages(prev => [...prev, {
        id: `sent-${Date.now()}`,
        text: inputText,
        timestamp: new Date().toLocaleTimeString(),
        type: 'sent'
      }]);
      setTestResults(prev => ({ ...prev, messageSend: true }));
      setInputText('');
    }
  };

  // 运行连接测试
  const runConnectionTest = async () => {
    setTestResults({});
    setMessages([]);
    
    try {
      // 测试连接
      const connected = await connect();
      setTestResults(prev => ({ ...prev, connection: connected }));
      
      if (connected) {
        // 测试发送消息
        setTimeout(() => {
          const sendSuccess = send(WebSocketEventType.MESSAGE_RECEIVED, {
            text: '测试消息',
            sessionId: 'test-session',
            type: 'test'
          });
          setTestResults(prev => ({ ...prev, messageSend: sendSuccess }));
        }, 1000);
      }
    } catch (error) {
      logger.error('WebSocket test failed', error as Error);
      setTestResults(prev => ({ ...prev, connection: false }));
    }
  };

  // 清除测试结果
  const clearTest = () => {
    setMessages([]);
    setTestResults({});
    setInputText('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'bg-green-500';
      case 'CONNECTING': return 'bg-yellow-500';
      case 'DISCONNECTED': return 'bg-gray-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            WebSocket 功能测试
            <Badge className={getStatusColor(connectionState)}>
              {isConnected() ? <Wifi className="h-4 w-4 mr-1" /> : <WifiOff className="h-4 w-4 mr-1" />}
              {connectionState}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 连接控制 */}
          <div className="flex gap-2">
            <Button 
              onClick={handleConnect} 
              disabled={isConnected()}
              variant={isConnected() ? "secondary" : "default"}
            >
              <Wifi className="h-4 w-4 mr-2" />
              连接
            </Button>
            <Button 
              onClick={disconnect} 
              disabled={!isConnected()}
              variant="outline"
            >
              <WifiOff className="h-4 w-4 mr-2" />
              断开
            </Button>
            <Button onClick={runConnectionTest} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              运行测试
            </Button>
            <Button onClick={clearTest} variant="ghost">
              清除
            </Button>
          </div>

          <Separator />

          {/* 测试结果 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">连接测试</div>
              <Badge variant={testResults.connection === true ? "default" : 
                             testResults.connection === false ? "destructive" : "secondary"}>
                {testResults.connection === true ? "✅ 成功" : 
                 testResults.connection === false ? "❌ 失败" : "⏳ 待测"}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">发送测试</div>
              <Badge variant={testResults.messageSend === true ? "default" : 
                             testResults.messageSend === false ? "destructive" : "secondary"}>
                {testResults.messageSend === true ? "✅ 成功" : 
                 testResults.messageSend === false ? "❌ 失败" : "⏳ 待测"}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">接收测试</div>
              <Badge variant={testResults.messageReceive === true ? "default" : 
                             testResults.messageReceive === false ? "destructive" : "secondary"}>
                {testResults.messageReceive === true ? "✅ 成功" : 
                 testResults.messageReceive === false ? "❌ 失败" : "⏳ 待测"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* 消息测试 */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="输入测试消息..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={!isConnected()}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!isConnected() || !inputText.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 消息历史 */}
          {messages.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">消息历史</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`text-xs p-2 rounded ${
                        msg.type === 'sent' ? 'bg-blue-50 text-blue-900' : 'bg-green-50 text-green-900'
                      }`}>
                        <div className="font-medium">{msg.text}</div>
                        <div className="text-muted-foreground">{msg.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}