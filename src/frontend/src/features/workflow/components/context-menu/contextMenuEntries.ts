import type { MenuEntry, MenuSection } from './contextMenuData';

export function buildContextMenuEntries(sections: MenuSection[]): MenuEntry[] {
  return sections.reduce<MenuEntry[]>((acc, section) => {
    if (section.id === 'request') {
      acc.push({ id: 'request-label', type: 'label', label: 'Request' });
      section.items.filter((item) => item.id !== 'request').forEach((item) => {
        acc.push({ id: item.id, type: 'action', item, indented: true });
      });
      return acc;
    }

    section.items.forEach((item) => {
      acc.push({ id: item.id, type: 'action', item });
    });
    return acc;
  }, []);
}

export function filterEntriesForSection(section: MenuSection, entries: MenuEntry[]) {
  return entries.filter((entry) =>
    section.id === 'request'
      ? entry.id === 'request-label' || section.items.some((item) => item.id === entry.id)
      : section.items.some((item) => item.id === entry.id),
  );
}
