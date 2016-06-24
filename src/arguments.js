import {
  isArray, isEmpty, isFunction, isUndefined,
  compact, first, flatten, zipObject, every, map, flow,
  keys as objectKeys, omit, values, reduce
} from 'lodash';

/**
 * @module arguments
 * @private
 */

const flatCompact = flow(flatten, compact);

/**
 * @example
 *
 * let alex = { name: 'Alex' }, chris = { name: 'Chris' };
 *
 * isSingleRecord(alex)         // true
 * isSingleRecord([alex])       // false
 * isSingleRecord(alex, chris)  // false
 * isSingleRecord()             // false
 * isSingleRecord(null)         // false
 * isSingleRecord([])           // false
 *
 * This is typically for for determining whether to return an array or
 * individual record.
 *
 * @param {...(Object|Object[])} records One or more records
 * @returns {bool}
 *   True if a single record is provided outside of an array.
 */
export function isSingleRecord(...records) {
  return records.length === 1 && !isArray(first(records));
}

/**
 * @param {...(Object|Object[])} records One or more records
 * @returns {Object|Object[]}
 *   If single record, return it. Otherwise
 * @see isSingle
 */
export function normalizeRecords(...records) {
  if (isEmpty(records)) {
    throw new TypeError(
      `Expected 'records' to contain one or more records or arrays of records`
    );
  }

  return isSingleRecord(...records)
    ? first(records) || null
    : flatCompact(records);
}

export const isComposite = isArray;

/**
 * Get number of columns in a given key.
 */
export function keyCardinality(key) {
  if (isComposite(key)) {
    return key.length;
  }
  return key == null ? 0 : 1;
}

/**
 * Check that keys both have the same cardinality (and can therefore be used in
 * a join).
 */
export function keysCompatible(firstKey, ...otherKeys) {
  const cardinality = keyCardinality(firstKey);
  return cardinality > 0 &&
    every(otherKeys, key => keyCardinality(key) === cardinality);
}

export function assertKeysCompatible(keys) {
  if (!keysCompatible(...values(keys))) {
    const formatted = map(keys, (value, key) => `${key}=${value}`).join(', ');
    throw new TypeError(`Mismatched key types. ${formatted}`);
  }
}

export function ensureArray(maybeArray) {
  if (isUndefined(maybeArray)) {
    return [];
  }
  return isArray(maybeArray) ? maybeArray : [maybeArray];
}


/**
 * Resolves any key values of the given object into their return values.
 */
export function resolveObject(object, ...args) {
  return reduce(object, (result, value, key) => {
    const resolved = isFunction(value) ? value.apply(this, args) : value;
    if (!isUndefined(resolved)) {
      result[key] = resolved;
    }
    return result;
  }, {});
}

/**
 * Like `_.defaults`, but resolves any functions properties into their
 * return values before assigning them.
 *
 * @returns {Object}
 *   Target object, or copy of target object with defaults applied.
 */
export function defaultsResolved(target = {}, source, ...args) {
  const defaults = omit(source, objectKeys(target));
  if (isEmpty(defaults)) {
    return target;
  }
  const resolved = resolveObject.call(this, defaults, ...args);
  return { ...resolved, ...target };
}

export function assignResolved(target = {}, source, ...args) {
  return isEmpty(source)
    ? target
    : { ...target, ...resolveObject.call(this, source, ...args) };
}

export function keyValueToObject(key, value) {
  return isArray(key)
    ? zipObject(key, value)
    : { [key] : value };
}

/**
 * @summary
 *
 * Validate an ID value.
 *
 * @description
 *
 * Checks if a supplied ID value is a valid identifier. For a single value
 * this will return false only for `undefined` or `null`. For an array, will
 * return false if any of the elements are `null` or `undefined`.
 *
 * @param {mixed|mixed[]} id
 *   Either a single ID value or, for composite IDs, an array of values.
 * @returns {bool}
 *   True if this ID is valid. Otherwise false.
 */
export function isValidId(id) {
  const result = isComposite(id)
    ? every(id, value => value != null)
    : id != null;
  return result;
}

// in: { a: ['b', 'c'], d: 'e' }
// out: [
//  ['a', 'b']
//  ['a', 'c']
//  ['d', 'e']
// ]
export function flattenPairs(object) {
  return reduce(object, (result, value, key) => {
    if (isArray(value)) {
      result.push(...value.map(v => [key, v]));
    } else {
      result.push([key, value]);
    }
    return result;
  }, []);
}
