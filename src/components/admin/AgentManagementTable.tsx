"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/lib/stores/adminStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { Progress } from "../ui/progress";

export function AgentManagementTable() {
  const { agents, fetchAgents, isLoading } = useAdminStore();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const getStatusVariant = (status: 'online' | 'busy' | 'offline') => {
    switch(status) {
        case 'online': return 'bg-green-500';
        case 'busy': return 'bg-orange-500';
        case 'offline': return 'bg-gray-400';
    }
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Session Load</TableHead>
            <TableHead>Share ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-24" /></div></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                </TableRow>
            ))
          ) : agents.length > 0 ? (
            agents.map((agent) => (
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
                    <Badge className="capitalize border-none">
                        <span className={`h-2 w-2 rounded-full mr-2 ${getStatusVariant(agent.status)}`}></span>
                        {agent.status}
                    </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <span>{agent.sessionLoad}/{agent.maxLoad}</span>
                        <Progress value={(agent.sessionLoad / agent.maxLoad) * 100} className="w-24 h-2" />
                    </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm text-muted-foreground">{agent.shareId}</code>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                    No agents found.
                </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
