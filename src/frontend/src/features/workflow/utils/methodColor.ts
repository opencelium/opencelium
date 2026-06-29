import type { MethodWithId } from '../types/connection';

export function readableTextColor(hex: string): string {
  const normalized = hex.replace('#', '');
  if (normalized.length < 6) return '#ffffff';
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
}

export function getDuplicateMethodIndexByColor(methods: MethodWithId[]): Map<string, number> {
  const groups = new Map<string, MethodWithId[]>();
  for (const method of methods) {
    const connectorKey = method.connector?.connectorId ?? method.connector?.title ?? 'system';
    const key = `${connectorKey}::${method.name}`;
    const list = groups.get(key) ?? [];
    list.push(method);
    groups.set(key, list);
  }

  const indexByColor = new Map<string, number>();
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    members.forEach((member, index) => {
      if (member.color) indexByColor.set(member.color.toLowerCase(), index + 1);
    });
  }
  return indexByColor;
}
