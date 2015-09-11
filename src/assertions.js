import { any } from 'lodash/collection';
import { dropRight, last } from 'lodash/array';
import { keys } from 'lodash/object';

export function assertType(value, name, testsByTypeName) {
  const isValid = any(testsByTypeName, (test, typeName) => test(value));

  if (!isValid) {
    const validTypes = keys(testsByTypeName);
    const humanized = [
      dropRight(validTypes, 1).join(', '),
      last(validTypes)
    ].join(' or ');

    throw new TypeError(
      `Expected '${name}' to be a ${humanized}, got ${value}`
    );
  }
}
