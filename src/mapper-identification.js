import { isString, isArray, isObject, isNumber } from 'lodash/lang';
import { head } from 'lodash/array';
import { assertType } from './assertions';
import { List } from 'immutable';
const { isList } = List;


const defaultOptions = {
  idAttribute: 'id'
}

const methods = {

  idAttribute(idAttribute) {
    return this.setOption('idAttribute', idAttribute);
  },

  identify(record) {
    let idAttribute = this.getOption('idAttribute');

    if (isList(idAttribute)) {
      idAttribute = idAttribute.toArray();
    }

    return this.identifyBy(idAttribute, record);
  },

  identifyBy(attribute, record) {

    // If records is an array it might be multiple records. However, if the
    // first element of the array is either an object or an array (ie. not
    // a valid key value) we assume that this a collection.
    //
    // Use `isObject` because the attribute may be an Immutable collection.
    const isComposite = isObject(attribute);
    const isSingle = !isArray(record) || isComposite && !isObject(head(record));

    return isSingle
      ? this.identifyOneBy(attribute, record)
      : this.identifyAllBy(attribute, record);
  },

  identifyOneBy(attribute, record) {

    if (attribute == null) {
      throw new TypeError(`'attribute' cannot be null or undefined`);
    }

    // Just return if this is a basic data type. We assume it's a key value
    // already.
    //
    //     (5, 'id') -> 5
    //
    if (!isObject(record)) {
      return record;
    }

    // Simple non-composite key.
    //
    //     ({id: 5}, 'id') -> 5
    //
    const isComposite = isObject(attribute);

    if (!isComposite) {
      return this.getAttribute(attribute, record);
    }

    // Composite keys are handled differently, return an array.

    // If this is an array, assume it contains composite key values, and return
    // it.
    //
    //     ([0, 1], ['id_a', 'id_b']) -> [0, 1]
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
    return attribute.map(a => {
      return this.getAttribute(a, record)
    });
  },

  identifyAllBy(attribute, records) {
    return records.map(
      record => this.identifyOneBy(attribute, record)
    );
  }
}

export default { methods, defaultOptions };
