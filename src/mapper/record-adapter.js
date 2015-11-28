import { isString, isUndefined } from 'lodash/lang';
import { omit } from 'lodash/object';
import { identity } from 'lodash/utility';
import { reduce } from 'lodash/collection';

const methods = {

  // Overridable interface.

  /** @protected */
  getAttributes: identity,

  /** @protected */
  getAttribute(record, attribute) {
    return record[attribute];
  },

  /** @protected */
  setAttribute(record, attribute, value) {
    record[attribute] = value;
    return record;
  },

  /**
   * Optionally override this with `getAttribute`. Will work either way.
   * @protected
   */
  setAttributes(record, attributes) {
    return reduce(attributes, (accumulator, value, attribute) =>
      this.setAttribute(accumulator, attribute, value)
    , record);
  },

  /** @protected */
  createRecord(attributes = {}) {
    return attributes;
  },

  /** @protected */
  destroyRecord(record) {
    return null;
  },

  // Private interface implemented in terms of the above.

  /** @private */
  columnsToRecord(columns) {
    return this.createRecord(this.columnsToAttributes(columns));
  },

  /** @private */
  setColumns(record, columns) {
    // Short circuit early - `null` should never be passed to
    // `attributesToColumns` as it's intended to be overridden and the client
    // code should not be burdened with null checks.
    return columns == null
      ? record
      : this.setAttributes(record, this.attributesToColumns(columns));
  },

  /** @private */
  pickAttributes(record, attributes) {

    // Important to support non-array in the case of passing in a key (which
    // may be an array or single value).
    if (isString(attributes)) {
      const value = this.getAttribute(record, attributes);
      return isUndefined(value)
        ? {}
        : { [attributes]: value };
    }

    // Don't use `_.pick` here because `getAttribute` may be overridden to do
    // something expensive.
    return reduce(attributes, (acc, attribute) => {
      const value = this.getAttribute(record, attribute);
      if (!isUndefined(value)) {
        acc[attribute] = value;
      }
      return acc;
    }, {});
  },

  /** @private */
  omitAttributes(record, attributes) {
    const allAttributes = this.getAttributes(record);
    return omit(allAttributes, attributes);
  },

  setRelated(record, relationName, related) {
    record[relationName] = related;
    return record;
  },

  getRelated(record, relationName) {
    record[relationName];
  }

};

export default { methods };
