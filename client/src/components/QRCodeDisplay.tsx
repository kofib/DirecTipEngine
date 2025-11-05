import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Share2 } from "lucide-react";
import * as QRCode from "qrcode";

interface QRCodeDisplayProps {
  url: string;
  workerName: string;
}

export default function QRCodeDisplay({ url, workerName }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (error: Error | null | undefined) => {
          if (error) console.error("QR Code generation error:", error);
        }
      );
    }
  }, [url]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    link.download = `${workerName.replace(/\s+/g, "-").toLowerCase()}-tip-qr.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
    console.log("QR code downloaded");
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((blob) => resolve(blob!));
      });

      const file = new File([blob], "qr-code.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Tip ${workerName}`,
          text: `Scan to tip ${workerName} directly`,
          files: [file],
        });
        console.log("QR code shared");
      } else {
        handleDownload();
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">My QR Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg">
            <canvas ref={canvasRef} data-testid="canvas-qr-code" />
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleDownload}
            className="w-full"
            size="lg"
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>

          <Button
            onClick={handleShare}
            variant="outline"
            className="w-full"
            size="lg"
            data-testid="button-share-qr"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>{url}</p>
        </div>
      </CardContent>
    </Card>
  );
}
