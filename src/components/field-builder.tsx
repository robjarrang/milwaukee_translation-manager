"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, GripVertical, Plus } from "lucide-react";

export interface FieldDefinition {
  id: string;
  name: string;
  type: "text" | "textarea" | "url";
}

interface FieldBuilderProps {
  fields: FieldDefinition[];
  onChange: (fields: FieldDefinition[]) => void;
}

let nextId = 1;
function genId() {
  return `field-${nextId++}-${Date.now()}`;
}

export function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
  const addField = () => {
    onChange([...fields, { id: genId(), name: "", type: "text" }]);
  };

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, key: keyof FieldDefinition, value: string) => {
    onChange(
      fields.map((f) =>
        f.id === id ? { ...f, [key]: value } : f
      )
    );
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onChange(newFields);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Fields</h3>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="h-4 w-4 mr-1" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed">
          No fields yet. Click &ldquo;Add Field&rdquo; to get started.
        </p>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-center gap-2 border bg-card p-3"
          >
            <div className="flex flex-col gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => moveField(index, "up")}
                disabled={index === 0}
              >
                <GripVertical className="h-3 w-3 rotate-0" />
                <span className="sr-only">Move up</span>
              </Button>
            </div>

            <span className="text-xs text-muted-foreground w-6 text-center shrink-0">
              {index + 1}
            </span>

            <Input
              placeholder="Field name (e.g. Subject Line)"
              value={field.name}
              onChange={(e) => updateField(field.id, "name", e.target.value)}
              className="flex-1"
              name="fieldName"
            />

            <Select
              value={field.type}
              onValueChange={(v) => updateField(field.id, "type", v as string)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Textarea</SelectItem>
                <SelectItem value="url">URL</SelectItem>
              </SelectContent>
            </Select>
            {/* Hidden input so formData picks up the type */}
            <input type="hidden" name="fieldType" value={field.type} />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeField(field.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Common presets */}
      {fields.length === 0 && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            onChange([
              { id: genId(), name: "Subject Line", type: "text" },
              { id: genId(), name: "Preview Text", type: "text" },
              { id: genId(), name: "Hero Title", type: "text" },
              { id: genId(), name: "Hero Description", type: "textarea" },
              { id: genId(), name: "Hero CTA Text", type: "text" },
              { id: genId(), name: "Hero CTA Link", type: "url" },
            ]);
          }}
        >
          Load email preset (Subject, Preview, Hero)
        </Button>
      )}
    </div>
  );
}
