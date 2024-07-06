export type AuthorisationType = 'Night shooting' | 'Out of season' | 'Female';
export type AuthorisationStatus = 'Incomplete' | 'Complete' | 'Partial';
export type DeerSpecies = 'roe' | 'red' | 'sika' | 'fallow' | 'none';

export type Property = {
  name: string;
  code: string;
};

// Landing page.
export type AuthorisationReturn = {
  id: string;
  number: string;
  property: string;
  type: AuthorisationType;
  returnDate: Date;
  status: AuthorisationStatus;
};

// Landing page.
export type AnnualReturn = {
  id: string;
  propertyId: string;
  propertyCode: string;
  property: string;
  season: string;
  returnDate: Date;
  status: AuthorisationStatus;
};

// Data collected during the return flow.
export type AuthorisationPropertyReturnsStatusData = {
  propertyId: number;
  propertyName: string;
  code: string;
  status: string;
  speciesShot?: DeerSpecies[];
  deerCulled?: {
    roe: DeerCulledAuthorisation;
    red: DeerCulledAuthorisation;
    sika: DeerCulledAuthorisation;
    fallow: DeerCulledAuthorisation;
  };
};

export type DeerCulledAnnual = {
  agriculture: AnnualDeerCulledGender;
  openRange: AnnualDeerCulledGender;
  woodland: AnnualDeerCulledGender;
};

export type AnnualDeerCulledGender = {
  male: number;
  femaleInSeason: number;
  femaleOutSeason: number;
  calves: number;
};

export type DeerCulledAuthorisation = {
  agriculture?: AuthorisationDeerCulledGender;
  woodland?: AuthorisationDeerCulledGender;
  naturalHeritage?: AuthorisationDeerCulledGender;
  publicSafety?: AuthorisationDeerCulledGender;
};

/* Used for both authorisation deer culled and natural causes in the annual flow */
export type AuthorisationDeerCulledGender = {
  male: number | undefined;
  female: number | undefined;
  calves: number | undefined;
};

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export type AuthorisationTypeFromDatabase = {
  id: number;
  startDate: string;
  endDate: string;
  AuthorisationType: AuthorisationTypeAndSubTypes;
};

export type AuthorisationTypeAndSubTypes = {
  id: number;
  AuthorisationId: number;
  type: 'closedSeason' | 'nightShooting' | 'female' | undefined;
  agriculturalLand: boolean;
  naturalHeritage: boolean;
  publicSafety: boolean;
  woodland: boolean;
};
