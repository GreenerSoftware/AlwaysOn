import {type AuthorisationPropertyReturnsStatusData} from 'types';

export const mockData: AuthorisationPropertyReturnsStatusData[] = [
  {
    propertyId: 1,
    propertyName: 'Aberchalder and Glenbuck',
    code: 'some-property-code',
    status: 'Incomplete',
  },
  {
    propertyId: 2,
    propertyName: 'Property 2',
    code: 'some-property-code-2',
    status: 'Incomplete',
  },
];

export const propertyReturnsMockData = {
  result: {
    returnsData: mockData,
  },
};
