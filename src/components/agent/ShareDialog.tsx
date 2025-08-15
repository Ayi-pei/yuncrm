

"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Copy, Download, Loader2, Image as ImageIcon, User, Code, Headset } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import QRCode, { QRCodeProps } from "qrcode.react";
import { mockApi } from "@/lib/mock-api";
import { SegmentedControl } from "../shared/SegmentedControl";
import { useAgentStore } from "@/lib/stores/agentStore";

interface ShareDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const APP_ICON_SVG_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWhlYWRzZXQiPjxwYXRoIGQ9Ik0xOCAxN2ExIDAgMCAxLSAxIDEgNiA2IDAgMCAxLTYgNnYxYTEgMSAwIDAgMSA1IDIuNUE4LjUgOC41IDAgMCAwIDE4IDE3WiIvPjxwYXRoIGQ9Ik0xOCAxN2ExIDAgMCAxLSAxIDEgNiA2IDAgMCAxLTYgNnYxYTEgMSAwIDAgMSAxIDAgNCA0IDAgMCAwIDQtNEgxN2ExIDEgMCAwIDEgMS0xWiIvPjxwYXRoIGQ9Im0xNSA1IgMiAyLTMgMy0yLTJ6bS0zIDRMNyAxNWw1IDUiLz48cGF0aCBkPSJNMy41IDIwLjVDMi42IDIwLjUgMiAxOS45IDIgMTl2LTZzMC00IDQgNGwwIDJjMCAxLjEgMCAxLjEtMSAxLjEtMS4xIDAtMS4xIDAtMS4xLTEuMVoiLz48L3N2Zz4=";

export function ShareDialog({ isOpen, setIsOpen }: ShareDialogProps) {
    const { user } = useAuthStore();
    const { agent } = useAgentStore();
    const { toast } = useToast();
    const [shareUrl, setShareUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [qrStyle, setQrStyle] = useState<"none" | "icon" | "avatar">("none");
    const [qrImageSrc, setQrImageSrc] = useState<string | null>(null);

    useEffect(() => {
        const generateUrl = async () => {
            if (isOpen && user?.id) {
                setIsLoading(true);
                try {
                    // This API call now creates a short-lived, expiring alias token
                    const alias = await mockApi.getOrCreateAlias(user.id);
                    if (alias) {
                        const baseUrl = window.location.origin;
                        const url = `${baseUrl}/naoiod/${alias.token}`;
                        setShareUrl(url);
                    } else {
                         toast({ title: "错误", description: "无法生成分享链接，请稍后重试。", variant: "destructive" });
                    }
                } catch (e) {
                    toast({ title: "错误", description: "无法生成分享链接。", variant: "destructive" });
                } finally {
                    setIsLoading(false);
                }
            }
        };
        
        if(isOpen) {
            generateUrl();
        } else {
            // Reset URL when dialog is closed
            setShareUrl("");
        }
    }, [user, isOpen, toast]);

    useEffect(() => {
        if (qrStyle === 'none') {
            setQrImageSrc(null);
        } else if (qrStyle === 'icon') {
            setQrImageSrc(APP_ICON_SVG_DATA_URL);
        } else if (qrStyle === 'avatar' && agent?.avatar) {
            setQrImageSrc(agent.avatar);
        } else {
            setQrImageSrc(null);
        }
    }, [qrStyle, agent]);
    
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
          downloadLink.download = `agentverse-share-qr.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          toast({ title: "已下载", description: "二维码已保存为PNG图片。" });
        }
      };
    
    const qrCodeProps: QRCodeProps = {
        id: "qr-code-canvas",
        value: shareUrl,
        size: 192,
        level: "H",
        includeMargin: true,
        ...(qrImageSrc && {
            imageSettings: {
                src: qrImageSrc,
                height: 35,
                width: 35,
                excavate: true,
            },
        }),
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>分享您的聊天链接</DialogTitle>
                    <DialogDescription>
                        与访客分享此唯一链接或二维码，即可开始与您的专属聊天会话。链接有独立有效期，过期将自动失效。
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-6 pt-4">
                    <div className="p-4 bg-white rounded-lg border">
                        {isLoading || !shareUrl ? (
                            <div className="h-[192px] w-[192px] bg-gray-200 animate-pulse rounded-md flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <QRCode {...qrCodeProps} />
                        )}
                    </div>
                     <SegmentedControl
                        value={qrStyle}
                        onValueChange={(val) => setQrStyle(val as any)}
                        options={[
                            { value: "none", label: "标准", icon: Code },
                            { value: "icon", label: "图标", icon: Headset },
                            { value: "avatar", label: "头像", icon: User, disabled: !agent?.avatar },
                        ]}
                    />

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
