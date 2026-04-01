"use client";

import { useState, useRef, useEffect } from "react";
import { renameProject } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface EditableProjectNameProps {
  projectId: string;
  initialName: string;
}

export function EditableProjectName({
  projectId,
  initialName,
}: EditableProjectNameProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleSave = async () => {
    if (!name.trim() || name.trim() === initialName) {
      setName(initialName);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await renameProject(projectId, name);
      toast.success("Project renamed");
      setEditing(false);
    } catch {
      toast.error("Failed to rename project");
      setName(initialName);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(initialName);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-lg font-black uppercase tracking-wider h-9 w-auto max-w-md"
          disabled={saving}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleSave}
          disabled={saving}
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-xl">{initialName}</h1>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
