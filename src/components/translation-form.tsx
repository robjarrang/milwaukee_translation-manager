"use client";

import { useState } from "react";
import { saveTranslations } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/copy-button";
import { groupFields } from "@/lib/field-groups";
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

function TranslationFieldRow({ field }: { field: TranslationField }) {
  return (
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
            {new Date(field.translatedUpdatedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* English reference */}
      <div className="bg-muted/50 p-3 border border-border">
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
  );
}

export function TranslationForm({
  projectId,
  regionId,
  localeCode,
  fields,
}: TranslationFormProps) {
  const [saving, setSaving] = useState(false);
  const grouped = groupFields(fields);

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

  let itemIndex = 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {grouped.map((item) => {
        const showSep = itemIndex > 0;
        itemIndex++;

        if (item.type === "field" && item.field) {
          return (
            <div key={item.field.id}>
              {showSep && <Separator className="mb-6" />}
              <TranslationFieldRow field={item.field} />
            </div>
          );
        }
        if (item.type === "group" && item.groupName && item.fields) {
          return (
            <div key={item.groupName}>
              {showSep && <Separator className="mb-6" />}
              <div className="border-l-4 border-l-[#DB011C] bg-muted/30 p-4 space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#DB011C]">
                  {item.groupName}
                </span>
                {item.fields.map((f) => (
                  <TranslationFieldRow key={f.id} field={f} />
                ))}
              </div>
            </div>
          );
        }
        return null;
      })}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={saving} size="lg">
          {saving ? "Saving..." : "Save Translations"}
        </Button>
      </div>
    </form>
  );
}
