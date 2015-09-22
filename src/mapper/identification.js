import { isArray, isEmpty, isNumber, isObject, isString } from 'lodash/lang';
import { any } from 'lodash/collection';
import { head, flatten } from 'lodash/array';
import { assertType } from '../assertions';

const options = {
  idAttribute: 'id'
}

const methods = {

  /**
   * @method isNew
   * @belongsTo Mapper
   * @summary
   *
   * Check if the record exists in the database.
   *
   * @description
   *
   * By default `isNew` will simply check for the existance of the {@link
   * Mapper#idAttribute idAttribute} on the given record. This method
   * can be overridden for custom behavior.
   *
   * @param {Object} record
   *   Record to check.
   * @returns {bool}
   *   `true` if the model exists in database, otherwise `false`.
   */
  isNew(record) {
    const id = this.identify(record);
    return this.isValidId(id);
  },

  /**
   * @method isValidId
   * @belongsTo Mapper
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
  isValidId(id) {
    return isArray(id)
      ? any(id, id => id == null)
      : id == null;
  },

  /**
   * @method idAttribute
   * @belongsTo Mapper
   * @summary
   *
   * Set the primary key attribute (or attributes).
   *
   * @param {string|string[]} idAttribute
   *   Name of primary key attribute.
   * @returns {Mapper}
   *   Mapper with primary key attribute set.
   */
  idAttribute(idAttribute) {
    return this.setOption('idAttribute', idAttribute);
  },

  /**
   * @method identify
   * @belongsTo Mapper
   * @summary
   *
   * Get the ID value for one or more records.
   *
   * @description
   *
   * Helper method used internally. Uses the currently set {@link
   * Mapper#idAttribute} to determine the ID value of a record (or an array of
   * records). Also accepts ID values instead of records, allowing it to be used
   * to normalize results.
   *
   * @example
   *
   * Person = Mapper.idAttribute('id');
   *
   * Person.identify({ id: 5, name: 'John Smith' });
   * // -> 5
   *
   * Person.identify([{ id: 2, name: 'Jane' }, { id: 3, name: 'Bill' }]);
   * // -> [2, 3]
   *
   * const Membership = Mapper.idAttribute(['person_id', 'group_id']);
   *
   * Membership.identify([
   *   { person_id: 2, group_id: 10 },
   *   { person_id: 3, group_id: 10 }
   * ]);
   * // -> [[2, 10], [3, 10]]
   *
   * Membership.identify([10, 20]);
   * // -> [10, 20]
   *
   * @param {mixed} record
   *   One or more records or IDs.
   * @returns {mixed|mixed[]}
   *   ID or IDs of given records.
   */
  identify(...records) {
    let idAttribute = this.getOption('idAttribute');
    return this.identifyBy(idAttribute, ...records);
  },

  identifyBy(attribute, ...records) {

    if (isEmpty(records)) {
      return undefined;
    }

    const isComposite = isArray(attribute);
    const record = head(records); 
    const isSingle =
      records.length === 1 &&
      !isArray(record) ||
      isComposite && !isObject(head(record));

    return isSingle
      ? this.identifyOneBy(attribute, record)
      : this.identifyAllBy(attribute, flatten(records));
  },

  identifyOneBy(attribute, record) {

    if (attribute == null) {
      throw new TypeError(`'attribute' cannot be null or undefined`);
    }

    // Just return if this is a basic data type. We assume it's a key value
    // already.
    //
    //     ('id', 5) -> 5
    //
    if (!isObject(record)) {
      return record;
    }

    // Simple non-composite key.
    //
    //     ('id', {id: 5}) -> 5
    //
    const isComposite = isObject(attribute);

    if (!isComposite) {
      return this.getAttribute(record, attribute);
    }

    // Composite keys are handled differently, return an array.

    // If this is an array, assume it contains composite key values, and return
    // it.
    //
    //     (['id_a', 'id_b'], [0, 1]) -> [0, 1]
    //
    if (isArray(record)) {

      if (record.length !== attribute.length) throw new TypeError(
        `Invalid composite key length, expected length ${attribute.length},` +
        ` got '${record}'`
      );

      return record;
    }

    // If this is a record with a composite key, do this:
    // 
    //     (['id_a', 'id_b'], {id_a: 0, id_b: 1}) -> [0, 1]
    //
    return attribute.map(a => this.getAttribute(record, a));
  },

  identifyAllBy(attribute, records) {
    return records.map(
      record => this.identifyOneBy(attribute, record)
    );
  },

  pickIdentity(record) {
    const idAttribute = this.getOption('idAttribute');
    return this.pickAttributes(record, idAttribute);
  }
}

export default { options, methods };
