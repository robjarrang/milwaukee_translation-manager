"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";

interface ShareLinkProps {
  url: string;
}

export function ShareLink({ url }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Project link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <code className="text-sm flex-1 truncate">{url}</code>
      <Button variant="ghost" size="sm" onClick={handleCopy}>
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-1 text-green-600" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-1" />
            Copy Link
          </>
        )}
      </Button>
    </div>
  );
}
