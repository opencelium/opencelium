type SidebarListItem = {
  key: string;
  title: string;
  text: string;
};

export const normalizeSidebarQuery = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

export const matchesSidebarTitle = (title: string, query: string, hasSearch: boolean) => {
  if (!hasSearch) return true;
  if (!query) return false;
  return title.toLowerCase().includes(query);
};

export const mapNamesToSidebarItems = (
  items: readonly string[],
  text: string,
): SidebarListItem[] => items.map((item) => ({ key: item, title: item, text }));
