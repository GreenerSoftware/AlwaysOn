import test from 'ava';
import {buildQueryParameters} from './build-query-parameters';

test('buildQueryParameters - should build correctly query string', (t) => {
  const result = buildQueryParameters({
    someParam: 'some-param-value',
    someOtherParam: 'some-other-param-value',
  });

  t.is(result, '?someParam=some-param-value&someOtherParam=some-other-param-value');
});

test('buildQueryParameters - should return a blank query string for empty object', (t) => {
  const result = buildQueryParameters({});

  t.is(result, '');
});
