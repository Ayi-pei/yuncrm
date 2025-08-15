
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Copy, Download } from "lucide-react";
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
        if (isOpen && user?.shareId) {
            // Use a production-friendly base URL instead of window.location.origin
            const baseUrl = "https://agentverse.app"; 
            const url = `${baseUrl}/noiod/${user.shareId}`;
            setShareUrl(url);
        }
    }, [user, isOpen]);
    
    const handleCopy = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "已复制！", description: "分享链接已复制到剪贴板。" });
    }

    const handleDownloadQR = () => {
        const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
        if (canvas) {
          const pngUrl = canvas
            .toDataURL("image/png")
            .replace("image/png", "image/octet-stream");
          let downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `agentverse-share-${user?.shareId}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          toast({ title: "已下载", description: "二维码已保存为PNG图片。" });
        }
      };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>分享您的聊天链接</DialogTitle>
                    <DialogDescription>
                        与访客分享此唯一链接或二维码，即可开始与您的专属聊天会话。
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-6 pt-4">
                    <div className="p-4 bg-white rounded-lg border">
                        {shareUrl ? (
                            <QRCode id="qr-code-canvas" value={shareUrl} size={192} level={"H"} includeMargin={true} />
                        ) : (
                            <div className="h-[208px] w-[208px] bg-gray-200 animate-pulse rounded-md" />
                        )}
                    </div>
                    <div className="w-full flex items-center gap-2">
                        <Input value={shareUrl} placeholder="正在生成链接..." readOnly className="text-sm" />
                        <Button variant="outline" size="icon" onClick={handleCopy} disabled={!shareUrl}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={handleDownloadQR} disabled={!shareUrl}>
                        <Download className="mr-2 h-4 w-4"/>
                        下载二维码
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

