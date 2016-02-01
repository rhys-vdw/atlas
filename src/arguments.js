import { compact, first, flatten, zipObject } from 'lodash/array';
import { every, map } from 'lodash/collection';
import { flow } from 'lodash/function';
import { isArray, isEmpty, isFunction, isUndefined } from 'lodash/lang';
import { keys as objectKeys, mapValues, omit, values } from 'lodash/object';

// Functions
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
export function resolveObject(object) {
  return mapValues(object, (value, key) =>
    isFunction(value) ? value(object) : value
  );
}

/**
 * Like `_.defaults`, but resolves any functions properties into their
 * return values before assigning them.
 *
 * @returns {Object}
 *   Target object, or copy of target object with defaults applied.
 */
export function defaultsResolved(target, source) {
  const required = omit(source, objectKeys(target));
  if (isEmpty(required)) {
    return target || {};
  }
  const defaults = resolveObject(required);
  return { ...defaults, ...target };
}

export function assignResolved(target, source) {
  return isEmpty(source)
    ? target || {}
    : { ...target, ...resolveObject(source) };
}

export function keyValueToObject(key, value) {
  return isArray(key)
    ? zipObject(key, value)
    : { [key] : value };
}

/**
 * @function isValidId
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

