
"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/lib/stores/adminStore";
import type { AccessKey, AccessKeyType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Trash, Edit, Copy, Power, PowerOff } from "lucide-react";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import { PageHeader } from "../shared/PageHeader";
import { cn } from "@/lib/utils";

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

  const getStatusVariant = (status: AccessKey['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-400/20';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-400/20';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-400/20';
      case 'used': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-400/20';
      default: return 'bg-muted text-muted-foreground';
    }
  }
  
  const translateStatus = (status: AccessKey['status']) => {
     switch (status) {
      case 'active': return '有效';
      case 'suspended': return '暂停';
      case 'expired': return '过期';
      case 'used': return '已使用';
      default: return '未知';
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => handleOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          创建密钥
        </Button>
      </div>
      <div className="border rounded-lg mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称/备注</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>使用次数</TableHead>
              <TableHead>到期时间</TableHead>
              <TableHead>创建于</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
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
                    <Badge variant={key.key_type === 'admin' ? 'default' : 'secondary'}>{key.key_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize border", getStatusVariant(key.status))}>
                      {translateStatus(key.status)}
                    </Badge>
                  </TableCell>
                   <TableCell>{key.usageCount} / {key.maxUsage || '∞'}</TableCell>
                  <TableCell>{key.expiresAt ? format(parseISO(key.expiresAt), "PPP HH:mm", { locale: zhCN }) : "永不"}</TableCell>
                  <TableCell>{format(parseISO(key.createdAt), "PPP", { locale: zhCN })}</TableCell>
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
                         {key.status !== 'expired' && key.status !== 'used' && (
                            <DropdownMenuItem onClick={() => handleToggleStatus(key)}>
                               {key.status === 'active' ? <PowerOff className="mr-2 h-4 w-4"/> : <Power className="mr-2 h-4 w-4"/>}
                               {key.status === 'active' ? '暂停' : '激活'}
                            </DropdownMenuItem>
                        )}
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
                    <TableCell colSpan={7} className="h-24 text-center">
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
    createKey: (data: Partial<Omit<AccessKey, 'id' | 'key' | 'createdAt'>>) => Promise<AccessKey | null>;
    updateKey: (id: string, updates: Partial<AccessKey>) => Promise<AccessKey | null>;
    toast: ({ title, description }: { title: string, description: string }) => void;
}

function KeyFormDialog({ isOpen, setIsOpen, editingKey, createKey, updateKey, toast }: KeyFormDialogProps) {
    const [name, setName] = useState('');
    const [notes, setNotes] = useState('');
    const [keyType, setKeyType] = useState<AccessKeyType>('agent');
    
    useEffect(() => {
        if(editingKey) {
            setName(editingKey.name);
            setNotes(editingKey.notes || "");
            setKeyType(editingKey.key_type);
        } else {
            setName('');
            setNotes('');
            setKeyType('agent');
        }
    }, [editingKey, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            name,
            notes,
            key_type: keyType
        }
        if(editingKey) {
            await updateKey(editingKey.id, { name, notes });
            toast({ title: "密钥已更新", description: "访问密钥已成功更新。" });
        } else {
            const newKey = await createKey(data);
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
                        {editingKey ? "更新此访问密钥的名称或备注。" : "将生成一个新密钥。如果类型为 'agent'，将自动创建关联的客服坐席。"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">名称/备注</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="例如：客服专员小爱" />
                        </div>
                        {!editingKey && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">类型</Label>
                                <Select onValueChange={(value: AccessKeyType) => setKeyType(value)} defaultValue={keyType}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="选择一个类型" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="agent">客服 (Agent)</SelectItem>
                                        <SelectItem value="admin">管理员 (Admin)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">内部备注</Label>
                            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" placeholder="（可选）仅管理员可见" />
                        </div>
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

    