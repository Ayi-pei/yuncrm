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
    toast({ title: "Copied!", description: "Access key copied to clipboard." });
  };

  const handleOpenModal = (key: AccessKey | null = null) => {
    setEditingKey(key);
    setIsModalOpen(true);
  };
  
  const handleToggleStatus = async (key: AccessKey) => {
    const newStatus = key.status === 'active' ? 'suspended' : 'active';
    await updateKey(key.id, { status: newStatus });
    toast({ title: "Status Updated", description: `Key for ${key.name} has been ${newStatus}.` });
  };
  
  const handleDelete = async (id: string) => {
    await deleteKey(id);
    toast({ title: "Key Deleted", description: "The access key has been permanently deleted." });
  }

  return (
    <>
      <PageHeader title="Key Management" description="Create, edit, and manage access keys for your agents and admins.">
        <Button onClick={() => handleOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Key
        </Button>
      </PageHeader>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                      {key.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{key.lastUsedAt ? format(parseISO(key.lastUsedAt), "PPP p") : "Never"}</TableCell>
                  <TableCell>{format(parseISO(key.createdAt), "PPP")}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleCopyKey(key.key)}>
                          <Copy className="mr-2 h-4 w-4"/> Copy Key
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenModal(key)}>
                          <Edit className="mr-2 h-4 w-4"/> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(key)}>
                           {key.status === 'active' ? <PowerOff className="mr-2 h-4 w-4"/> : <Power className="mr-2 h-4 w-4"/>}
                           {key.status === 'active' ? 'Suspend' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash className="mr-2 h-4 w-4"/> Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the key
                                    and remove all associated data.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(key.id)} className="bg-destructive hover:bg-destructive/90">
                                    Delete
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
                        No keys found.
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
            toast({ title: "Key Updated", description: "The access key has been successfully updated." });
        } else {
            const newKey = await createKey({ name, role });
            if(newKey) {
                navigator.clipboard.writeText(newKey.key);
                toast({ title: "Key Created & Copied", description: "The new key has been copied to your clipboard." });
            }
        }
        setIsOpen(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingKey ? 'Edit Key' : 'Create New Key'}</DialogTitle>
                    <DialogDescription>
                        {editingKey ? "Update the name for this access key." : "A new key will be generated. The associated agent will also be created."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="e.g. Support Agent Alice" />
                        </div>
                        {!editingKey && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">Role</Label>
                                <Select onValueChange={(value: UserRole) => setRole(value)} defaultValue={role}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="agent">Agent</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">{editingKey ? 'Save Changes' : 'Create Key'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
