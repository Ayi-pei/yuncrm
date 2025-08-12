"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/lib/stores/adminStore";
import type { AccessKey, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Trash, Edit, Copy, Power, PowerOff } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import { PageHeader } from "../shared/PageHeader";

export function KeyManagementTable() {
  const { keys, fetchKeys, isLoading, createKey, updateKey, deleteKey } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<AccessKey | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);
  
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "已复制！", description: "访问密钥已复制到剪贴板。" });
  };

  const handleOpenModal = (key: AccessKey | null = null) => {
    setEditingKey(key);
    setIsModalOpen(true);
  };
  
  const handleToggleStatus = async (key: AccessKey) => {
    const newStatus = key.status === 'active' ? 'suspended' : 'active';
    await updateKey(key.id, { status: newStatus });
    toast({ title: "状态已更新", description: `“${key.name}”的密钥已被${newStatus === 'active' ? '激活' : '暂停'}。` });
  };
  
  const handleDelete = async (id: string) => {
    await deleteKey(id);
    toast({ title: "密钥已删除", description: "访问密钥已被永久删除。" });
  }

  return (
    <>
      <PageHeader title="密钥管理" description="为您的智能体和管理员创建、编辑和管理访问密钥。">
        <Button onClick={() => handleOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          创建密钥
        </Button>
      </PageHeader>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>上次使用</TableHead>
              <TableHead>创建于</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : keys.length > 0 ? (
              keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <Badge variant={key.role === 'admin' ? 'default' : 'secondary'}>{key.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={key.status === 'active' ? 'outline' : 'destructive'} className={key.status === 'active' ? 'text-green-600 border-green-300' : ''}>
                      {key.status === 'active' ? '有效' : '暂停'}
                    </Badge>
                  </TableCell>
                  <TableCell>{key.lastUsedAt ? format(parseISO(key.lastUsedAt), "PPP p") : "从未使用"}</TableCell>
                  <TableCell>{format(parseISO(key.createdAt), "PPP")}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">打开菜单</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleCopyKey(key.key)}>
                          <Copy className="mr-2 h-4 w-4"/> 复制密钥
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenModal(key)}>
                          <Edit className="mr-2 h-4 w-4"/> 编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(key)}>
                           {key.status === 'active' ? <PowerOff className="mr-2 h-4 w-4"/> : <Power className="mr-2 h-4 w-4"/>}
                           {key.status === 'active' ? '暂停' : '激活'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash className="mr-2 h-4 w-4"/> 删除
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>您确定吗？</AlertDialogTitle>
                                <AlertDialogDescription>
                                    此操作无法撤销。这将永久删除该密钥并移除所有关联数据。
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(key.id)} className="bg-destructive hover:bg-destructive/90">
                                    删除
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        未找到密钥。
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <KeyFormDialog 
        isOpen={isModalOpen} 
        setIsOpen={setIsModalOpen} 
        editingKey={editingKey}
        createKey={createKey}
        updateKey={updateKey}
        toast={toast}
      />
    </>
  );
}


interface KeyFormDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    editingKey: AccessKey | null;
    createKey: (data: { name: string; role: UserRole }) => Promise<AccessKey | null>;
    updateKey: (id: string, updates: Partial<AccessKey>) => Promise<AccessKey | null>;
    toast: ({ title, description }: { title: string, description: string }) => void;
}

function KeyFormDialog({ isOpen, setIsOpen, editingKey, createKey, updateKey, toast }: KeyFormDialogProps) {
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>('agent');
    
    useEffect(() => {
        if(editingKey) {
            setName(editingKey.name);
            setRole(editingKey.role);
        } else {
            setName('');
            setRole('agent');
        }
    }, [editingKey, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(editingKey) {
            await updateKey(editingKey.id, { name });
            toast({ title: "密钥已更新", description: "访问密钥已成功更新。" });
        } else {
            const newKey = await createKey({ name, role });
            if(newKey) {
                navigator.clipboard.writeText(newKey.key);
                toast({ title: "密钥已创建并复制", description: "新密钥已复制到您的剪贴板。" });
            }
        }
        setIsOpen(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingKey ? '编辑密钥' : '创建新密钥'}</DialogTitle>
                    <DialogDescription>
                        {editingKey ? "更新此访问密钥的名称。" : "将生成一个新密钥。相关的智能体也将被创建。"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">名称</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="例如：客服专员小爱" />
                        </div>
                        {!editingKey && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">角色</Label>
                                <Select onValueChange={(value: UserRole) => setRole(value)} defaultValue={role}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="选择一个角色" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="agent">智能体</SelectItem>
                                        <SelectItem value="admin">管理员</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">取消</Button>
                        </DialogClose>
                        <Button type="submit">{editingKey ? '保存更改' : '创建密钥'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
