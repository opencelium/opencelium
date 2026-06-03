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
