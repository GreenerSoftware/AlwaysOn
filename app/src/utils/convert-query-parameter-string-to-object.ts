export const convertQueryParameterStringToObject = (parameters: string[]): Record<string, string> => {
  const entries: Record<string, string> = {};
  for (const item of parameters) {
    const split = item.split('=');
    const [key, ...value] = split;
    entries[key] = value.join('=');
  }

  return entries;
};
