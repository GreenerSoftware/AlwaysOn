import test from 'ava';
import {formUtils} from './form';

test('Cleaning an undefined input results in undefined', (t) => {
  t.is(formUtils.cleanInputString(undefined), undefined);
});

test('Cleaning a non-string input results in undefined', (t) => {
  t.is(formUtils.cleanInputString(1 as unknown as string), undefined);
  t.is(formUtils.cleanInputString(1.234 as unknown as string), undefined);
  t.is(formUtils.cleanInputString(true as unknown as string), undefined);
  t.is(formUtils.cleanInputString([] as unknown as string), undefined);
  t.is(formUtils.cleanInputString([1, 2] as unknown as string), undefined);
  t.is(formUtils.cleanInputString(['test'] as unknown as string), undefined);
  t.is(formUtils.cleanInputString({} as unknown as string), undefined);
  t.is(formUtils.cleanInputString({test: 'test'} as unknown as string), undefined);
});

test('Cleaning an empty or all-whitespace input results in undefined', (t) => {
  t.is(formUtils.cleanInputString(''), undefined);
  t.is(formUtils.cleanInputString(' '), undefined);
  t.is(formUtils.cleanInputString('\t'), undefined);
  t.is(formUtils.cleanInputString('\n'), undefined);
  t.is(formUtils.cleanInputString('\r'), undefined);
  t.is(formUtils.cleanInputString(' \t\r\n\t '), undefined);
});

test('Cleaning an input with no leading or trailing whitespace results in input unchanged', (t) => {
  t.is(formUtils.cleanInputString('test'), 'test');
  t.is(formUtils.cleanInputString('test with infix whitespace'), 'test with infix whitespace');
  t.is(
    formUtils.cleanInputString('test with infix whitespace \n around a newline'),
    'test with infix whitespace \n around a newline',
  );
});

test('Cleaning an input with leading, trailing or surrounding whitespace results in trimmed input', (t) => {
  t.is(formUtils.cleanInputString(' test'), 'test');
  t.is(formUtils.cleanInputString('test '), 'test');
  t.is(formUtils.cleanInputString(' test '), 'test');

  t.is(formUtils.cleanInputString('\ttest'), 'test');
  t.is(formUtils.cleanInputString('test\t'), 'test');
  t.is(formUtils.cleanInputString('\ttest\t'), 'test');

  t.is(formUtils.cleanInputString('\ntest'), 'test');
  t.is(formUtils.cleanInputString('test\n'), 'test');
  t.is(formUtils.cleanInputString('\ntest\n'), 'test');

  t.is(formUtils.cleanInputString('\rtest'), 'test');
  t.is(formUtils.cleanInputString('test\r'), 'test');
  t.is(formUtils.cleanInputString('\rtest\r'), 'test');

  t.is(formUtils.cleanInputString(' \t\r\n\t test'), 'test');
  t.is(formUtils.cleanInputString('test \t\r\n\t '), 'test');
  t.is(formUtils.cleanInputString(' \t\r\n\t test \t\r\n\t '), 'test');
});

test('Cleaning obviously wrong radio input results in undefined', (t) => {
  t.is(formUtils.cleanRadioBoolean(1 as unknown as string), undefined);
  t.is(formUtils.cleanRadioBoolean(1.234 as unknown as string), undefined);
  t.is(formUtils.cleanRadioBoolean(true as unknown as string), undefined);
  t.is(formUtils.cleanRadioBoolean('maybe'), undefined);
  t.is(formUtils.cleanRadioBoolean([] as unknown as string), undefined);
  t.is(formUtils.cleanRadioBoolean([1, 2] as unknown as string), undefined);
  t.is(formUtils.cleanRadioBoolean(['test'] as unknown as string), undefined);
  t.is(formUtils.cleanRadioBoolean({} as unknown as string), undefined);
  t.is(formUtils.cleanRadioBoolean({test: 'test'} as unknown as string), undefined);
});

test('Cleaning slightly wrong radio input results in undefined', (t) => {
  t.is(formUtils.cleanRadioBoolean('Yes'), undefined);
  t.is(formUtils.cleanRadioBoolean('YES'), undefined);
  t.is(formUtils.cleanRadioBoolean('No'), undefined);
  t.is(formUtils.cleanRadioBoolean('NO'), undefined);
  t.is(formUtils.cleanRadioBoolean('true'), undefined);
  t.is(formUtils.cleanRadioBoolean('True'), undefined);
  t.is(formUtils.cleanRadioBoolean('TRUE'), undefined);
  t.is(formUtils.cleanRadioBoolean('false'), undefined);
  t.is(formUtils.cleanRadioBoolean('False'), undefined);
  t.is(formUtils.cleanRadioBoolean('FALSE'), undefined);
  t.is(formUtils.cleanRadioBoolean('1'), undefined);
  t.is(formUtils.cleanRadioBoolean('0'), undefined);
});

test('Cleaning radio input string results in booleans', (t) => {
  t.is(formUtils.cleanRadioBoolean('yes'), true);
  t.is(formUtils.cleanRadioBoolean('no'), false);
});

test('Cleaning undefined multiple checkboxes results in multiple false values', (t) => {
  t.deepEqual(formUtils.cleanMultiCheckboxBooleans(undefined, ['value1', 'value2']), [false, false]);
});

test('Cleaning a checkbox not in the list results in multiple false values', (t) => {
  t.deepEqual(formUtils.cleanMultiCheckboxBooleans('value3', ['value1', 'value2']), [false, false]);
});

test('Cleaning multiple checkboxes not in the list results in multiple false values', (t) => {
  t.deepEqual(formUtils.cleanMultiCheckboxBooleans(['value3', 'value4'], ['value1', 'value2']), [false, false]);
});

test('Cleaning a checkbox in the list results in one true other multiple false values', (t) => {
  t.deepEqual(formUtils.cleanMultiCheckboxBooleans('value1', ['value1', 'value2']), [true, false]);
  t.deepEqual(formUtils.cleanMultiCheckboxBooleans('value2', ['value1', 'value2']), [false, true]);
});

test('Cleaning all checkboxes in the list results in multiple true values', (t) => {
  t.deepEqual(formUtils.cleanMultiCheckboxBooleans(['value1', 'value2'], ['value1', 'value2']), [true, true]);
});
