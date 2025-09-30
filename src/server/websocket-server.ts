/**
 * WebSocket 服务端模拟器
 * 用于开发和测试WebSocket功能
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  userRole: 'admin' | 'agent' | 'visitor';
  sessionId?: string;
  lastHeartbeat: number;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  id: string;
}

export class MockWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private heartbeatInterval!: NodeJS.Timeout;
  private port: number;

  constructor(port: number = 8080) {
    this.port = port;
    this.wss = new WebSocketServer({ 
      port,
      verifyClient: this.verifyClient.bind(this)
    });

    this.setupServer();
    this.startHeartbeat();
    
    console.log(`🚀 Mock WebSocket Server started on port ${port}`);
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }) {
    // 在生产环境中，这里应该验证origin和认证信息
    return true;
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const query = parse(req.url || '', true).query;
      const userId = query.userId as string;
      const userRole = query.role as 'admin' | 'agent' | 'visitor';

      if (!userId || !userRole) {
        ws.close(1008, 'Missing userId or role');
        return;
      }

      const clientId = `${userRole}-${userId}`;
      const client: ConnectedClient = {
        ws,
        userId,
        userRole,
        lastHeartbeat: Date.now()
      };

      this.clients.set(clientId, client);
      console.log(`✅ Client connected: ${clientId}`);

      // 发送连接确认
      this.sendToClient(clientId, {
        type: 'connection_established',
        data: { userId, userRole, serverTime: new Date().toISOString() },
        timestamp: new Date().toISOString(),
        id: this.generateId()
      });

      // 监听消息
      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      // 处理断开连接
      ws.on('close', (code: number, reason: Buffer) => {
        console.log(`❌ Client disconnected: ${clientId}, code: ${code}, reason: ${reason.toString()}`);
        this.clients.delete(clientId);
      });

      // 处理错误
      ws.on('error', (error: Error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`📨 Message from ${clientId}:`, message.type);

    switch (message.type) {
      case 'message_received':
        this.handleChatMessage(clientId, message);
        break;
      
      case 'typing_indicator':
        this.handleTypingIndicator(clientId, message);
        break;
      
      case 'agent_status_changed':
        this.handleAgentStatusChange(clientId, message);
        break;
      
      case 'heartbeat':
        client.lastHeartbeat = Date.now();
        break;
      
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private handleChatMessage(clientId: string, message: WebSocketMessage) {
    const { sessionId, message: chatMessage } = message.data;
    
    // 模拟消息处理延迟
    setTimeout(() => {
      // 广播给该会话的所有参与者
      this.broadcastToSession(sessionId, {
        type: 'message_received',
        data: {
          sessionId,
          message: {
            ...chatMessage,
            id: this.generateId(),
            timestamp: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString(),
        id: this.generateId()
      }, clientId);

      // 模拟自动回复（仅对访客）
      if (Math.random() > 0.7) {
        setTimeout(() => {
          this.simulateAutoReply(sessionId);
        }, 1000 + Math.random() * 2000);
      }
    }, 100 + Math.random() * 200);
  }

  private handleTypingIndicator(clientId: string, message: WebSocketMessage) {
    const { sessionId, typing } = message.data;
    
    if (message.data.type === 'heartbeat') {
      // 更新心跳时间
      const client = this.clients.get(clientId);
      if (client) {
        client.lastHeartbeat = Date.now();
      }
      return;
    }

    // 广播打字状态给会话中的其他人
    this.broadcastToSession(sessionId, {
      type: 'typing_indicator',
      data: { sessionId, typing, userId: message.data.agentId || message.data.userId },
      timestamp: new Date().toISOString(),
      id: this.generateId()
    }, clientId);
  }

  private handleAgentStatusChange(clientId: string, message: WebSocketMessage) {
    const { agentId, status } = message.data;
    
    // 广播给所有连接的客户端
    this.broadcast({
      type: 'agent_status_changed',
      data: { agentId, status },
      timestamp: new Date().toISOString(),
      id: this.generateId()
    }, clientId);
  }

  private simulateAutoReply(sessionId: string) {
    const replies = [
      "感谢您的消息，我马上为您处理。",
      "请稍等，我正在查询相关信息。",
      "您好，我已经收到您的消息。",
      "好的，我明白了您的需求。"
    ];

    const reply = replies[Math.floor(Math.random() * replies.length)];
    
    this.broadcastToSession(sessionId, {
      type: 'message_received',
      data: {
        sessionId,
        message: {
          id: this.generateId(),
          type: 'text',
          text: reply,
          sender: 'agent',
          timestamp: new Date().toISOString(),
          agentId: 'auto-reply-bot'
        }
      },
      timestamp: new Date().toISOString(),
      id: this.generateId()
    });
  }

  private broadcastToSession(sessionId: string, message: WebSocketMessage, excludeClientId?: string) {
    // 在实际应用中，这里需要查询数据库获取会话参与者
    // 这里简化为广播给所有相关的客户端
    for (const [clientId, client] of this.clients) {
      if (clientId === excludeClientId) continue;
      
      // 简单的会话匹配逻辑
      if (client.userRole === 'agent' || client.userRole === 'visitor') {
        this.sendToClient(clientId, message);
      }
    }
  }

  private broadcast(message: WebSocketMessage, excludeClientId?: string) {
    for (const [clientId] of this.clients) {
      if (clientId === excludeClientId) continue;
      this.sendToClient(clientId, message);
    }
  }

  private sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
        console.log(`📤 Sent to ${clientId}:`, message.type);
      } catch (error) {
        console.error(`Failed to send message to ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60秒超时

      for (const [clientId, client] of this.clients) {
        if (now - client.lastHeartbeat > timeout) {
          console.log(`💔 Client ${clientId} heartbeat timeout, disconnecting`);
          client.ws.close(1001, 'Heartbeat timeout');
          this.clients.delete(clientId);
        }
      }
    }, 30000); // 每30秒检查一次
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  public getStats() {
    return {
      connectedClients: this.clients.size,
      clients: Array.from(this.clients.entries()).map(([id, client]) => ({
        id,
        userId: client.userId,
        userRole: client.userRole,
        lastHeartbeat: new Date(client.lastHeartbeat).toISOString()
      }))
    };
  }

  public stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.wss.close(() => {
      console.log('🛑 WebSocket Server stopped');
    });
  }
}

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  const server = new MockWebSocketServer(8080);
  
  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n🔄 Gracefully shutting down...');
    server.stop();
    process.exit(0);
  });

  // 每30秒打印统计信息
  setInterval(() => {
    const stats = server.getStats();
    console.log(`📊 Server stats: ${stats.connectedClients} clients connected`);
  }, 30000);
}