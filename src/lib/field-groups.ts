/**
 * Groups flat fields by "Story N ..." naming convention.
 * Fields not matching the pattern remain standalone.
 */

export interface GroupedItem<T extends { name: string }> {
  type: "field" | "group";
  field?: T;
  groupName?: string;
  fields?: T[];
}

const STORY_RE = /^(Story \d+)\s+/i;

export function groupFields<T extends { name: string }>(
  fields: T[]
): GroupedItem<T>[] {
  const items: GroupedItem<T>[] = [];
  let curName: string | null = null;
  let curFields: T[] = [];

  const flush = () => {
    if (curName && curFields.length > 0) {
      items.push({
        type: "group",
        groupName: curName,
        fields: [...curFields],
      });
      curFields = [];
      curName = null;
    }
  };

  for (const f of fields) {
    const m = f.name.match(STORY_RE);
    if (m) {
      const name = m[1];
      if (name !== curName) {
        flush();
        curName = name;
      }
      curFields.push(f);
    } else {
      flush();
      items.push({ type: "field", field: f });
    }
  }
  flush();
  return items;
}

export function getNextStoryNumber<T extends { name: string }>(
  fields: T[]
): number {
  let max = 0;
  for (const f of fields) {
    const m = f.name.match(/^Story (\d+)\s+/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

/** Strip the "Story N " prefix to get just the sub-field label */
export function storySubLabel(name: string): string {
  return name.replace(STORY_RE, "");
}
