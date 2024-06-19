/* eslint-disable import/no-named-as-default-member */
import test from 'ava';
import Sinon from 'sinon';
import {convertQueryParameterStringToObject} from './convert-query-parameter-string-to-object';

test('convertQueryParamStringToObject - should build correct query string', (t) => {
  let result = {};
  result = convertQueryParameterStringToObject(['someParam=some-param-value?someOtherParam=some-other-value']);

  Sinon.assert.match(result, {
    someParam: 'some-param-value?someOtherParam=some-other-value',
  });

  t.pass();
});
