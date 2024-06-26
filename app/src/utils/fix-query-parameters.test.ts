/* eslint-disable import/no-named-as-default-member */
import test from 'ava';
import Sinon from 'sinon';
import {fixQueryParameters} from './fix-query-parameters';

test('fixQueryParameters - should build correct query string', (t) => {
  const result = fixQueryParameters({
    someParam: 'some-param-value?someOtherParam=some-other-value',
  });

  Sinon.assert.match(result, {
    someParam: 'some-param-value',
    someOtherParam: 'some-other-value',
  });

  t.pass();
});

test('fixQueryParameters - should build correct query string from string array', (t) => {
  const result = fixQueryParameters(['someParam=some-param-value?someOtherParam=some-other-value']);

  Sinon.assert.match(result, {
    someParam: 'some-param-value',
    someOtherParam: 'some-other-value',
  });

  t.pass();
});

test('fixQueryParameters - should build correctly for normal object', (t) => {
  const result = fixQueryParameters({
    someParam: 'some-param-value',
  });

  Sinon.assert.match(result, {
    someParam: 'some-param-value',
  });

  t.pass();
});
