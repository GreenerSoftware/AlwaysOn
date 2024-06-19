import {convertQueryParameterStringToObject} from './convert-query-parameter-string-to-object';

export const buildQueryParameters = (parameters: Record<string, string> | string[]): string => {
  if (Array.isArray(parameters)) {
    parameters = convertQueryParameterStringToObject(parameters);
  }

  const entries: string[] = [];
  for (const [index, item] of Object.keys(parameters).entries()) {
    const key = item;
    const value = parameters[key];

    const entryPrefix = index === 0 ? '?' : '&';

    entries.push(`${entryPrefix}${key}=${value}`);
  }

  return entries.join('');
};
