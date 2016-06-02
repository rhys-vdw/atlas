import { isUndefined, flatten, omit, identity, reduce } from 'lodash';

export default {

  // Overridable interface.

  /** @protected */
  createRecord(attributes = {}) {
    return attributes;
  },

  /** @protected */
  destroyRecord(record) {
    return null;
  },

  /** @protected */
  getAttributes: identity,

  /** @protected */
  getAttribute(record, attribute) {
    return record[attribute];
  },

  /** @protected */
  setAttributes(record, attributes) {
    return { ...record, ...attributes };
  },

  /** @protected */
  setRelated(record, related) {
    return { ...record, ...related };
  },

  /** @protected */
  getRelated(record, relationName) {
    record[relationName];
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
  pickAttributes(record, ...attributes) {

    if (record == null) {
      return {};
    }

    const flattened = flatten(attributes);

    return reduce(flattened, (acc, attribute) => {
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
};
