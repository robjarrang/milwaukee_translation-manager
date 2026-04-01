"use client";

import { useState } from "react";
import { saveEnglishValues } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/copy-button";
import { toast } from "sonner";

interface FieldWithValue {
  id: string;
  name: string;
  fieldType: "text" | "textarea" | "url";
  englishValue: string | null;
  englishUpdatedAt: Date | null;
}

interface EnglishValuesFormProps {
  projectId: string;
  fields: FieldWithValue[];
}

export function EnglishValuesForm({
  projectId,
  fields,
}: EnglishValuesFormProps) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await saveEnglishValues(projectId, formData);
      toast.success("English values saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={`english-${field.id}`} className="text-sm">
              {field.name}
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({field.fieldType})
              </span>
            </Label>
            {field.englishUpdatedAt && field.englishValue && (
              <span className="text-xs text-muted-foreground">
                Updated{" "}
                {new Date(field.englishUpdatedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          <input type="hidden" name="fieldId" value={field.id} />
          <div className="flex items-start gap-2">
            {field.fieldType === "textarea" ? (
              <Textarea
                id={`english-${field.id}`}
                name="value"
                defaultValue={field.englishValue ?? ""}
                placeholder={`Enter English ${field.name.toLowerCase()}...`}
                rows={3}
              />
            ) : (
              <Input
                id={`english-${field.id}`}
                name="value"
                type={field.fieldType === "url" ? "url" : "text"}
                defaultValue={field.englishValue ?? ""}
                placeholder={
                  field.fieldType === "url"
                    ? "https://..."
                    : `Enter English ${field.name.toLowerCase()}...`
                }
              />
            )}
            <CopyButton value={field.englishValue ?? ""} />
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save English Values"}
        </Button>
      </div>
    </form>
  );
}
