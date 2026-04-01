"use client";

import { useState } from "react";
import { saveTranslations } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/copy-button";
import { toast } from "sonner";

interface TranslationField {
  id: string;
  name: string;
  fieldType: "text" | "textarea" | "url";
  englishValue: string;
  translatedValue: string;
  translatedUpdatedAt: Date | null;
}

interface TranslationFormProps {
  projectId: string;
  regionId: string;
  localeCode: string;
  fields: TranslationField[];
}

export function TranslationForm({
  projectId,
  regionId,
  localeCode,
  fields,
}: TranslationFormProps) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await saveTranslations(projectId, regionId, localeCode, formData);
      toast.success("Translations saved");
    } catch {
      toast.error("Failed to save translations");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id}>
          {index > 0 && <Separator className="mb-6" />}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {field.name}
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  ({field.fieldType})
                </span>
              </Label>
              {field.translatedUpdatedAt && (
                <span className="text-xs text-muted-foreground">
                  Updated{" "}
                  {new Date(field.translatedUpdatedAt).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              )}
            </div>

            {/* English reference */}
            <div className="rounded-md bg-muted/50 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  English
                </span>
                <CopyButton value={field.englishValue} />
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {field.englishValue || (
                  <span className="italic text-muted-foreground">
                    No English value set
                  </span>
                )}
              </p>
            </div>

            {/* Translation input */}
            <input type="hidden" name="fieldId" value={field.id} />
            <div className="flex items-start gap-2">
              {field.fieldType === "textarea" ? (
                <Textarea
                  name="value"
                  defaultValue={field.translatedValue}
                  placeholder={`Enter ${field.name.toLowerCase()} translation...`}
                  rows={3}
                />
              ) : (
                <Input
                  name="value"
                  type={field.fieldType === "url" ? "url" : "text"}
                  defaultValue={field.translatedValue}
                  placeholder={
                    field.fieldType === "url"
                      ? "https://..."
                      : `Enter ${field.name.toLowerCase()} translation...`
                  }
                />
              )}
              <CopyButton value={field.translatedValue} />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={saving} size="lg">
          {saving ? "Saving..." : "Save Translations"}
        </Button>
      </div>
    </form>
  );
}
