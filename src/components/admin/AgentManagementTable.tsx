"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/lib/stores/adminStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "../ui/skeleton";
import type { User, UserStatus } from "@/lib/types";

export function AgentManagementTable() {
  const { agents, fetchAgents, isLoading } = useAdminStore();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const getStatusVariant = (status: UserStatus) => {
    switch(status) {
        case 'online': return 'bg-green-500';
        case 'busy': return 'bg-orange-500';
        case 'offline': return 'bg-gray-400';
        case 'away': return 'bg-yellow-400';
    }
  }
  
  const translateStatus = (status: UserStatus) => {
    switch(status) {
        case 'online': return '在线';
        case 'busy': return '忙碌';
        case 'offline': return '离线';
        case 'away': return '离开';
    }
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>智能体</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>上次活跃</TableHead>
            <TableHead>关联密钥</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-24" /></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                </TableRow>
            ))
          ) : agents.length > 0 ? (
            agents.map((agent: User) => (
              <TableRow key={agent.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback>{agent.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{agent.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                    <Badge variant={agent.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
                      {agent.role}
                    </Badge>
                </TableCell>
                <TableCell>
                    <Badge className="capitalize border-none text-white" style={{backgroundColor: getStatusVariant(agent.status)}}>
                        <span className={`h-2 w-2 rounded-full mr-2 bg-white`}></span>
                        {translateStatus(agent.status)}
                    </Badge>
                </TableCell>
                <TableCell>
                    {agent.lastActiveAt ? new Date(agent.lastActiveAt).toLocaleString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <code className="text-sm text-muted-foreground">{agent.accessKey}</code>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                    未找到智能体。
                </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
