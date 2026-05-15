export const getNextAttributeName = (attributes: Record<string, string>) => {
  let index = 1;
  let name = `attribute${index}`;
  while (attributes[name]) {
    index += 1;
    name = `attribute${index}`;
  }
  return name;
};
