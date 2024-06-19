import test from 'ava';
import {getBlankSeasonalDeerCulledObject, getBlankDeerCulledObject} from './get-blank-deer-culled-object';

test('getBlankSeasonalDeerCulledObject - should return blank deer culled object', (t) => {
  const result = getBlankSeasonalDeerCulledObject();

  t.deepEqual(result, {
    red: {
      agriculture: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
      woodland: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
      openRange: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
    },
    roe: {
      agriculture: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
      woodland: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
      openRange: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
    },
    sika: {
      agriculture: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
      woodland: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
      openRange: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
    },
    fallow: {
      agriculture: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
      woodland: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
      openRange: {male: 0, femaleInSeason: 0, femaleOutSeason: 0, calves: 0},
    },
  });
});

test('getBlankDeerCulledObject - should return blank deer culled object', (t) => {
  const result = getBlankDeerCulledObject();

  t.deepEqual(result, {
    red: {
      agriculture: {male: 0, female: 0, calves: 0},
      woodland: {male: 0, female: 0, calves: 0},
      openRange: {male: 0, female: 0, calves: 0},
    },
    roe: {
      agriculture: {male: 0, female: 0, calves: 0},
      woodland: {male: 0, female: 0, calves: 0},
      openRange: {male: 0, female: 0, calves: 0},
    },
    sika: {
      agriculture: {male: 0, female: 0, calves: 0},
      woodland: {male: 0, female: 0, calves: 0},
      openRange: {male: 0, female: 0, calves: 0},
    },
    fallow: {
      agriculture: {male: 0, female: 0, calves: 0},
      woodland: {male: 0, female: 0, calves: 0},
      openRange: {male: 0, female: 0, calves: 0},
    },
  });
});
