import { flow } from 'lodash/function';
import { isArray, isEmpty } from 'lodash/lang';
import { compact, first, flatten } from 'lodash/array';

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
      `Excepted 'records' to contain one or more records or an arrays of ` +
      `records`
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
  return isComposite(key) ? key.length : 1;
}

/**
 * Check that keys both have the same cardinality (and can therefore be used in
 * a join).
 */
export function keysCompatible(keyA, keyB) {
  return keyCardinality(keyA) == keyCardinality(keyB);
}
