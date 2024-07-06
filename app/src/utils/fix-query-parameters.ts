import {convertQueryParameterStringToObject} from './convert-query-parameter-string-to-object';

export const fixQueryParameters = (parameters: Record<string, string> | string[]): Record<string, string> => {
  if (Array.isArray(parameters)) {
    parameters = convertQueryParameterStringToObject(parameters);
  }

  let entries: Record<string, string> = {};
  for (const [_index, item] of Object.keys(parameters).entries()) {
    const key = item;
    const value = parameters[key];
    if (value.includes('?')) {
      const split = value.split('?');
      const mainParameterValue = split[0];
      const otherParameterKeyValue = split[1];
      const otherParameterSplit = otherParameterKeyValue.split('=');
      const otherParameterObject: Record<string, string> = {};

      otherParameterObject[otherParameterSplit[0]] = otherParameterSplit[1];

      entries[key] = mainParameterValue;
      entries = {...entries, ...otherParameterObject};
    } else {
      entries[key] = value;
    }
  }

  return entries;
};
