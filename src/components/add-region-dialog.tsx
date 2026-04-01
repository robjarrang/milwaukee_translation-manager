"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { REGIONS } from "@/lib/regions";
import { Plus } from "lucide-react";
import { addRegions } from "@/lib/actions";

interface AddRegionDialogProps {
  projectId: string;
  existingCodes: string[];
}

export function AddRegionDialog({
  projectId,
  existingCodes,
}: AddRegionDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const available = REGIONS.filter((r) => !existingCodes.includes(r.code));

  const toggleRegion = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === available.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(available.map((r) => r.code)));
    }
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      await addRegions(projectId, Array.from(selected));
      setSelected(new Set());
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="default" size="sm" />}>
        <Plus className="h-4 w-4 mr-1" />
        Add Region
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Regions</DialogTitle>
          <DialogDescription>
            Select the regions that need to provide translations for this project.
          </DialogDescription>
        </DialogHeader>

        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            All available regions have already been added.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-sm text-muted-foreground">
                {selected.size} of {available.length} selected
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAll}
              >
                {selected.size === available.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-1 pr-1">
              {available.map((region) => (
                <label
                  key={region.code}
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(region.code)}
                    onChange={() => toggleRegion(region.code)}
                    className="rounded accent-primary"
                  />
                  <span className="font-mono text-sm">{region.code}</span>
                  <span className="text-sm text-muted-foreground">
                    {region.label}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.size === 0 || loading}
          >
            {loading
              ? "Adding..."
              : `Add ${selected.size} Region${selected.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
