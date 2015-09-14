import { any, each } from 'lodash/collection';
import { dropRight, last, compact } from 'lodash/array';
import { keys } from 'lodash/object';
import { isEmpty } from 'lodash/lang';

import { NoRecordsFoundError } from './errors';

export function assertFound(mapper, response) {
  if (isEmpty(response)) throw new NoRecordsFoundError(
    mapper
  );
}

export function assertType(variables, testsByTypeName) {
  each(variables, (value, name) => {
    singleAssertType(value, name, testsByTypeName);
  });
}

function singleAssertType(value, name, testsByTypeName) {
  const isValid = any(testsByTypeName, (test, typeName) =>
    value instanceof test || test(value)
  );

  if (!isValid) {
    const validTypes = keys(testsByTypeName);
    const humanized = compact([
      dropRight(validTypes, 1).join(', '),
      last(validTypes)
    ]).join(' or ');

    throw new TypeError(
      `Expected '${name}' to be a ${humanized}, got ${value}`
    );
  }
}
