import test from 'ava';
import {licenceReferencePrefix} from '../application-config';
import {formatLicenceReferenceNumber, capitalise} from './format-utils';

test('formatLicenceReferenceNumber returns empty string for falsy input', (t) => {
  const expected = '';
  const actual = formatLicenceReferenceNumber(undefined);

  t.is(actual, expected);
});

test('formatLicenceReferenceNumber returns correctly formatted licence reference for 5-digit licenceID', (t) => {
  const licenceId5Digit = '12345';
  const expected = `${licenceReferencePrefix}${licenceId5Digit}`;
  const actual = formatLicenceReferenceNumber(licenceId5Digit);

  t.is(actual, expected);
});

test('formatLicenceReferenceNumber returns correctly formatted licence reference for 4-digit licenceID', (t) => {
  const licenceId4Digit = '1234';
  const expected = `${licenceReferencePrefix}0${licenceId4Digit}`;
  const actual = formatLicenceReferenceNumber(licenceId4Digit);

  t.is(actual, expected);
});

test('formatLicenceReferenceNumber returns correctly formatted licence reference for 3-digit licenceID', (t) => {
  const licenceId3Digit = '123';
  const expected = `${licenceReferencePrefix}00${licenceId3Digit}`;
  const actual = formatLicenceReferenceNumber(licenceId3Digit);

  t.is(actual, expected);
});

test('formatLicenceReferenceNumber returns correctly formatted licence reference for 2-digit licenceID', (t) => {
  const licenceId2Digit = '12';
  const expected = `${licenceReferencePrefix}000${licenceId2Digit}`;
  const actual = formatLicenceReferenceNumber(licenceId2Digit);

  t.is(actual, expected);
});

test('formatLicenceReferenceNumber returns correctly formatted licence reference for 1-digit licenceID', (t) => {
  const licenceId1Digit = '1';
  const expected = `${licenceReferencePrefix}0000${licenceId1Digit}`;
  const actual = formatLicenceReferenceNumber(licenceId1Digit);

  t.is(actual, expected);
});

test('formatUtils - capitalise - should return capitalised word', (t) => {
  const word = capitalise('some-word');
  t.is(word, 'Some-word');
});
