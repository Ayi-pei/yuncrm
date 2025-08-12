"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Copy } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode.react";

interface ShareDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function ShareDialog({ isOpen, setIsOpen }: ShareDialogProps) {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [shareUrl, setShareUrl] = useState("");

    useEffect(() => {
        if (user?.shareId && typeof window !== "undefined") {
            const url = `${window.location.origin}/chat/${user.shareId}`;
            setShareUrl(url);
        }
    }, [user, isOpen]);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "已复制！", description: "分享链接已复制到剪贴板。" });
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>分享聊天链接</DialogTitle>
                    <DialogDescription>
                        与访客分享此链接以开始与您的聊天会话。
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-6 py-4">
                    <div className="p-4 bg-white rounded-lg">
                        <QRCode value={shareUrl} size={192} />
                    </div>
                    <div className="w-full flex items-center gap-2">
                        <Input value={shareUrl} readOnly />
                        <Button variant="outline" size="icon" onClick={handleCopy}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
