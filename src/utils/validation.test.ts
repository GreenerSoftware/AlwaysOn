import test from 'ava';
import {validationUtils} from './validation';

test('non-existent or blank phone numbers are not valid', (t) => {
  t.is(validationUtils.validPhoneNumber(undefined), false);
  t.is(validationUtils.validPhoneNumber(''), false);
  t.is(validationUtils.validPhoneNumber('  '), false);
});

test('invalid phone number is not valid', (t) => {
  t.is(validationUtils.validPhoneNumber('0131'), false);
});

test('valid phone number is valid', (t) => {
  t.is(validationUtils.validPhoneNumber('0131 496 0000'), true);
});

test('non-existent or blank emails are not valid', (t) => {
  t.is(validationUtils.validEmailAddress(undefined), false);
  t.is(validationUtils.validEmailAddress(''), false);
  t.is(validationUtils.validEmailAddress('  '), false);
});

test('invalid emails are not valid', (t) => {
  t.is(validationUtils.validEmailAddress('nature.scot'), false);
  t.is(validationUtils.validEmailAddress('nature.scot@example'), false);
});

test('valid emails are valid', (t) => {
  t.is(validationUtils.validEmailAddress('nature.scot@example.org'), true);
});
