import { any, each } from 'lodash/collection';
import { dropRight, last, compact } from 'lodash/array';
import { keys } from 'lodash/object';
import Util from 'util';

export function assertType(variables, testsByTypeName) {
  each(variables, (value, name) => {
    singleAssertType(value, name, testsByTypeName);
  });
}

function singleAssertType(value, name, testsByTypeName) {
  const isValid = any(testsByTypeName, (test) =>
    value instanceof test || test(value)
  );

  if (!isValid) {
    const validTypes = keys(testsByTypeName);
    const humanized = compact([
      dropRight(validTypes, 1).join(', '),
      last(validTypes)
    ]).join(' or ');

    const prettyValue = Util.inspect(value, { depth: 4 });
    throw new TypeError(
      `Expected '${name}' to be a ${humanized}, got ${prettyValue}`
    );
  }
}
