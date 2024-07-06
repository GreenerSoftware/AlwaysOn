/* eslint-disable @typescript-eslint/naming-convention */
import {type AuthorisationReturn, type AnnualReturn, type AuthorisationTypeFromDatabase} from '../types';

export type ReturnsMockDataType = {
  id: string;
  authorisations: AuthorisationReturn[];
  annual: AnnualReturn[];
};

export const returnsMockData: ReturnsMockDataType = {
  id: '1',
  authorisations: [
    {
      id: '1',
      number: '1234',
      property: 'Aberchalder and Glenbuck',
      type: 'Out of season',
      returnDate: new Date(2024, 3, 7),
      status: 'Incomplete',
    },
  ],
  annual: [
    {
      id: '2',
      propertyId: '1000',
      season: '2023-2024',
      propertyCode: 'some-property-code',
      property: 'some-property',
      returnDate: new Date(2024, 5, 20),
      status: 'Incomplete',
    },
  ],
};

export const authorisationTypeMockData: AuthorisationTypeFromDatabase = {
  id: 1,
  startDate: '2024-02-11 00:00:00.000 +00:00',
  endDate: '2024-03-30 23:00:00.000 +00:00',
  AuthorisationType: {
    id: 1,
    AuthorisationId: 1,
    type: 'closedSeason',
    agriculturalLand: true,
    naturalHeritage: false,
    publicSafety: false,
    woodland: false,
  },
};
